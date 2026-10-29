"""Structured-data features: real estate valuation and construction project planning."""
from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool

import llm_client
import prompts
from schemas import PlanRequest, PlanResult, ValuationRequest, ValuationResult
from services import storage

router = APIRouter(prefix="/api", tags=["planning"])


@router.post("/valuation/estimate")
async def valuation(req: ValuationRequest):
    text = "Property details (JSON data):\n" + req.model_dump_json()
    result = await run_in_threadpool(llm_client.analyze, prompts.VALUATION, text, ValuationResult)
    data = result.model_dump()
    return {"id": storage.save_analysis("valuation", req.model_dump(), data), "result": data}


@router.post("/planning/generate")
async def planning(req: PlanRequest):
    text = "Project details (JSON data):\n" + req.model_dump_json()
    result = await run_in_threadpool(llm_client.analyze, prompts.PLANNING, text, PlanResult)
    # Server-side sanity: never trust the model for the budget comparison when a budget was given.
    if req.budget is not None:
        result.within_budget = result.total_estimated_cost <= req.budget
    data = result.model_dump()
    return {"id": storage.save_analysis("planning", req.model_dump(), data), "result": data}
