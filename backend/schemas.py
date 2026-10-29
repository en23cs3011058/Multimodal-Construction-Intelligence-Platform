"""Strict JSON contracts. The LLM must return data matching the *Result models;
the frontend renders only these fields, so the UI never depends on free-form text."""
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Severity = Literal["low", "moderate", "high", "critical"]
PPEState = Literal["worn", "missing", "not_visible"]


# ---------- Safety monitoring ----------
class Hazard(BaseModel):
    hazard: str
    severity: Severity
    location: str = "not specified"
    recommended_action: str


class PPEStatus(BaseModel):
    helmet: PPEState = "not_visible"
    safety_vest: PPEState = "not_visible"
    gloves: PPEState = "not_visible"
    safety_boots: PPEState = "not_visible"
    harness: PPEState = "not_visible"


class SafetyResult(BaseModel):
    image_usable: bool = Field(description="false if images are too blurry/dark/cropped to assess")
    site_summary: str
    hazards: List[Hazard] = []
    ppe: PPEStatus = PPEStatus()
    ppe_violations: List[str] = []
    overall_risk: Severity
    immediate_actions: List[str] = []
    confidence: float = Field(ge=0, le=1)
    notes: Optional[str] = None


# ---------- Crack analysis ----------
class CrackResult(BaseModel):
    image_usable: bool
    crack_detected: bool
    crack_type: Literal["hairline", "vertical", "horizontal", "diagonal", "stair_step", "map_pattern", "other", "none"]
    severity: Literal["none", "low", "moderate", "high", "critical"]
    estimated_width_mm: Optional[float] = None
    structural_concern: bool
    probable_causes: List[str] = []
    recommended_actions: List[str] = []
    needs_engineer_inspection: bool
    confidence: float = Field(ge=0, le=1)
    notes: Optional[str] = None


# ---------- Real estate valuation ----------
class ValuationRequest(BaseModel):
    location: str = Field(min_length=2, max_length=200)
    property_type: Literal["apartment", "independent_house", "villa", "plot", "commercial"] = "apartment"
    area_sqft: float = Field(gt=0, le=1_000_000)
    age_years: float = Field(default=0, ge=0, le=200)
    bedrooms: Optional[int] = Field(default=None, ge=0, le=50)
    condition: Literal["poor", "average", "good", "excellent"] = "good"
    amenities: List[str] = []
    currency: str = "INR"
    notes: Optional[str] = Field(default=None, max_length=1000)


class ValueFactor(BaseModel):
    factor: str
    impact: Literal["positive", "neutral", "negative"]
    explanation: str


class ValuationResult(BaseModel):
    currency: str
    estimated_value_low: float
    estimated_value_mid: float
    estimated_value_high: float
    price_per_sqft: float
    factors: List[ValueFactor] = []
    assumptions: List[str] = []
    confidence: float = Field(ge=0, le=1)
    disclaimer: str = "AI estimate for guidance only; not a certified valuation."
    notes: Optional[str] = None


# ---------- Project planning ----------
class PlanRequest(BaseModel):
    project_type: Literal["residential", "commercial", "industrial", "renovation", "road_or_civil"] = "residential"
    built_up_area_sqft: float = Field(gt=0, le=10_000_000)
    floors: int = Field(default=1, ge=1, le=100)
    location: str = Field(min_length=2, max_length=200)
    quality: Literal["basic", "standard", "premium"] = "standard"
    budget: Optional[float] = Field(default=None, gt=0)
    target_months: Optional[int] = Field(default=None, ge=1, le=120)
    currency: str = "INR"
    notes: Optional[str] = Field(default=None, max_length=1000)


class MaterialItem(BaseModel):
    item: str
    quantity: float
    unit: str
    estimated_cost: float


class CostCategory(BaseModel):
    category: str
    amount: float
    percent: float


class SchedulePhase(BaseModel):
    phase: str
    tasks: List[str] = []
    start_week: int = Field(ge=0)
    duration_weeks: int = Field(ge=1)


class PlanResult(BaseModel):
    currency: str
    total_estimated_cost: float
    cost_per_sqft: float
    within_budget: Optional[bool] = None
    materials: List[MaterialItem] = []
    cost_breakdown: List[CostCategory] = []
    schedule: List[SchedulePhase] = []
    total_duration_weeks: int
    architectural_visualization: str = Field(description="Plain-language description of massing, layout and elevation")
    key_risks: List[str] = []
    assumptions: List[str] = []
    confidence: float = Field(ge=0, le=1)
    notes: Optional[str] = None


# ---------- Daily assistance + weather ----------
class DailyRequest(BaseModel):
    site_location: str = Field(min_length=2, max_length=200)
    activities: List[str] = Field(min_length=1, max_length=15)
    crew_size: Optional[int] = Field(default=None, ge=1, le=10_000)
    notes: Optional[str] = Field(default=None, max_length=1000)


class ActivityAdvice(BaseModel):
    activity: str
    decision: Literal["go", "caution", "postpone"]
    reason: str


class DailyAdvice(BaseModel):
    summary: str
    overall_decision: Literal["go", "caution", "postpone"]
    activity_advice: List[ActivityAdvice] = []
    priorities: List[str] = []
    safety_reminders: List[str] = []
    weather_precautions: List[str] = []
    confidence: float = Field(ge=0, le=1)
    notes: Optional[str] = None


class WeatherSnapshot(BaseModel):
    place: str
    temperature_c: Optional[float] = None
    wind_kmh: Optional[float] = None
    precipitation_mm_today: Optional[float] = None
    rain_probability_pct: Optional[float] = None
    max_temp_c: Optional[float] = None
    min_temp_c: Optional[float] = None
    description: Optional[str] = None


class DailyResponse(BaseModel):
    weather: Optional[WeatherSnapshot] = None
    weather_available: bool
    advice: DailyAdvice


# ---------- Knowledge assistant ----------
class KnowledgeRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)


class KnowledgeResult(BaseModel):
    answer: str
    key_points: List[str] = []
    standards_referenced: List[str] = []
    follow_up_questions: List[str] = []
    confidence: float = Field(ge=0, le=1)
    notes: Optional[str] = None
