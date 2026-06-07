import os
from datetime import datetime
from typing import Optional, List

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "./predictions.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    filename = Column(String, nullable=False)
    disease = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_prediction(
    db: Session,
    filename: str,
    disease: str,
    confidence: float,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
) -> PredictionRecord:
    record = PredictionRecord(
        filename=filename,
        disease=disease,
        confidence=confidence,
        lat=lat,
        lng=lng,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_recent_predictions(db: Session, limit: int = 20) -> List[PredictionRecord]:
    return (
        db.query(PredictionRecord)
        .order_by(PredictionRecord.timestamp.desc())
        .limit(limit)
        .all()
    )