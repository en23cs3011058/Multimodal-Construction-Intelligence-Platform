"""Central configuration. All secrets come from environment variables / .env."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "app.db"

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-5-5")
# Mock mode is on if explicitly requested OR no API key is configured.
MOCK_LLM = os.getenv("MOCK_LLM", "false").lower() == "true" or not ANTHROPIC_API_KEY
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
MAX_IMAGE_BYTES = int(float(os.getenv("MAX_IMAGE_MB", "5")) * 1024 * 1024)
MAX_IMAGES = int(os.getenv("MAX_IMAGES", "4"))
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)
