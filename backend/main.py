import os
import math
import aiohttp
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from models import load_model, is_model_loaded, predict
from database import create_tables, get_db, save_prediction, get_recent_predictions
from treatments import get_treatment_info
from schemas import PredictionResponse, StoresResponse, StoreItem, HistoryItem, HealthResponse

load_dotenv()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    load_model()
    yield


app = FastAPI(
    title="Croplify API",
    description="AI-powered crop disease classification with treatment recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@app.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return HealthResponse(
        status="ok" if is_model_loaded() and db_ok else "degraded",
        model_loaded=is_model_loaded(),
        db_connected=db_ok,
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WebP.",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file received.")

    try:
        disease_key, confidence = predict(image_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

    if disease_key == "Unknown":
        return PredictionResponse(
            disease="Unknown",
            display_name="Unknown",
            confidence=confidence,
            severity="Low",
            description="",
            symptoms=[],
            treatment="",
            organic_treatment="",
            chemical_treatment="",
            prevention="",
            recovery_days=0,
            is_healthy=False,
            message="Low confidence — please try a clearer, well-lit image of a single leaf.",
        )

    info = get_treatment_info(disease_key)
    save_prediction(db, file.filename or "upload.jpg", disease_key, confidence, lat, lng)

    return PredictionResponse(
        disease=disease_key,
        display_name=info.get("display_name", disease_key),
        confidence=confidence,
        severity=info.get("severity", "Medium"),
        description=info.get("description", ""),
        symptoms=info.get("symptoms", []),
        treatment=info.get("treatment", ""),
        organic_treatment=info.get("organic_treatment", ""),
        chemical_treatment=info.get("chemical_treatment", ""),
        prevention=info.get("prevention", ""),
        recovery_days=info.get("recovery_days", 14),
        is_healthy=info.get("is_healthy", False),
    )


@app.get("/stores", response_model=StoresResponse)
async def get_nearby_stores(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(10.0, description="Search radius in km", ge=1, le=50),
) -> StoresResponse:
    radius_m = int(radius * 1000)
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node["shop"="agrarian"](around:{radius_m},{lat},{lng});
      node["shop"="garden_centre"](around:{radius_m},{lat},{lng});
      node["amenity"="marketplace"](around:{radius_m},{lat},{lng});
      node["shop"="farm"](around:{radius_m},{lat},{lng});
    );
    out body;
    """

    stores: list[StoreItem] = []
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
            async with session.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": overpass_query},
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for element in data.get("elements", []):
                        tags = element.get("tags", {})
                        store_lat = element.get("lat", 0)
                        store_lng = element.get("lon", 0)
                        name = tags.get("name", "Agricultural Store")
                        distance = haversine_km(lat, lng, store_lat, store_lng)
                        stores.append(
                            StoreItem(
                                name=name,
                                distance_km=round(distance, 2),
                                lat=store_lat,
                                lng=store_lng,
                                opening_hours=tags.get("opening_hours", "Not available"),
                                type=tags.get("shop", tags.get("amenity", "store")).replace("_", " ").title(),
                            )
                        )
                    stores.sort(key=lambda s: s.distance_km)
    except Exception as e:
        print(f"Overpass API error: {e}")

    return StoresResponse(stores=stores[:20], count=len(stores[:20]))


@app.get("/history", response_model=list[HistoryItem])
async def get_history(db: Session = Depends(get_db)) -> list[HistoryItem]:
    records = get_recent_predictions(db)
    return [
        HistoryItem(
            id=r.id,
            timestamp=r.timestamp,
            filename=r.filename,
            disease=r.disease,
            confidence=r.confidence,
            lat=r.lat,
            lng=r.lng,
        )
        for r in records
    ]