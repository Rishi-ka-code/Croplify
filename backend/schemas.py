from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PredictionResponse(BaseModel):
    disease: str
    display_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: str
    description: str
    symptoms: List[str]
    treatment: str
    organic_treatment: str
    chemical_treatment: str
    prevention: str
    recovery_days: int
    is_healthy: bool
    message: Optional[str] = None


class StoreItem(BaseModel):
    name: str
    distance_km: float
    lat: float
    lng: float
    opening_hours: Optional[str] = "Not available"
    type: Optional[str] = "Agricultural Store"


class StoresResponse(BaseModel):
    stores: List[StoreItem]
    count: int


class HistoryItem(BaseModel):
    id: int
    timestamp: datetime
    filename: str
    disease: str
    confidence: float
    lat: Optional[float]
    lng: Optional[float]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    db_connected: bool
    version: str = "1.0.0"