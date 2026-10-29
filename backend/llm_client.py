"""Single wrapper around the multimodal LLM (Anthropic Claude by default).

analyze() always returns a validated Pydantic object. The model is told to return JSON only;
we extract the JSON, validate it against the schema, and retry once with the validation error.
To swap providers (Bedrock, Gemini, OpenAI), only _call_model() needs changing.
"""
import base64
import json
import logging
import re
from dataclasses import dataclass
from typing import List, Optional, Type, TypeVar

from fastapi import HTTPException
from pydantic import BaseModel, ValidationError

import config
from mocks import MOCKS

log = logging.getLogger("llm")
T = TypeVar("T", bound=BaseModel)


@dataclass
class ImageInput:
    data: bytes
    media_type: str


_client = None


def _get_client():
    global _client
    if _client is None:
        import anthropic  # imported lazily so mock mode works without the package configured
        _client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY, timeout=90.0)
    return _client


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("No JSON object found in model output")
    return json.loads(text[start : end + 1])


def _call_model(system: str, messages: list) -> str:
    try:
        resp = _get_client().messages.create(
            model=config.LLM_MODEL, max_tokens=4000, system=system, messages=messages
        )
    except Exception as exc:  # network, auth, rate-limit, etc.
        log.exception("LLM call failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {type(exc).__name__}. Check API key and connectivity.")
    return "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")


def analyze(system_prompt: str, user_text: str, model_cls: Type[T], images: Optional[List[ImageInput]] = None) -> T:
    if config.MOCK_LLM:
        return model_cls.model_validate(MOCKS[model_cls.__name__])

    schema = json.dumps(model_cls.model_json_schema())
    system = (
        f"{system_prompt}\n\nRespond with ONE JSON object only (no prose, no markdown fences) that validates against "
        f"this JSON Schema. Use null for unknown optional values.\n{schema}"
    )
    content: list = []
    for img in images or []:
        content.append({"type": "image", "source": {"type": "base64", "media_type": img.media_type,
                                                    "data": base64.b64encode(img.data).decode()}})
    content.append({"type": "text", "text": user_text})
    messages = [{"role": "user", "content": content}]

    last_err = ""
    for attempt in range(2):
        raw = _call_model(system, messages)
        try:
            return model_cls.model_validate(_extract_json(raw))
        except (ValueError, ValidationError) as exc:
            last_err = str(exc)[:600]
            log.warning("Invalid model JSON (attempt %d): %s", attempt + 1, last_err)
            messages = messages + [
                {"role": "assistant", "content": raw or "(empty)"},
                {"role": "user", "content": f"That output was invalid: {last_err}\nReturn corrected JSON only."},
            ]
    raise HTTPException(status_code=502, detail="The AI returned an invalid response twice. Please retry.")
