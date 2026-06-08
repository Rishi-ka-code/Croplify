# 🌿 Croplify — AI Crop Disease Detection

> AI-powered crop disease classification with treatment recommendations, built with EfficientNetB0, FastAPI, and React PWA.


---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React PWA (Port 3000)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Scan    │  │ Results  │  │   Map    │  │ History  │   │
│  │ (Camera) │  │ (Result) │  │(Leaflet) │  │(SQLite)  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼──────────────┼─────────┘
        │             │             │              │
        ▼             ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Port 8000)                 │
│  POST /predict   GET /stores   GET /history   GET /health   │
│        │               │                                    │
│  TFLite Model    OpenStreetMap                              │
│  (EfficientNetB0) Overpass API    SQLite DB                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Clone and enter the project
git clone <repo-url> && cd crop-disease-detection

# 2. Place your trained model
mkdir -p models
cp /path/to/crop_disease_model.tflite models/

# 3. Run everything
docker-compose up --build
```


---

## Train Your Own Model (Kaggle)

1. Go to [kaggle.com/code](https://kaggle.com/code) → New Notebook
2. Add the PlantVillage dataset
3. Upload `notebook/crop_disease_training.ipynb`
4. Set Accelerator to **GPU T4 x2**
5. Run All (~30–45 min)
6. Download `crop_disease_model.tflite` from the Output tab
7. Place in `models/` directory

---

## API Reference

### `POST /predict`
Upload a leaf image for disease detection.

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@leaf.jpg" \
  -F "lat=28.6139" \
  -F "lng=77.2090"
```

Response:
```json
{
  "disease": "Tomato_Late_blight",
  "display_name": "Tomato — Late Blight",
  "confidence": 0.967,
  "severity": "Critical",
  "treatment": "Apply systemic fungicide within 24 hours...",
  "organic_treatment": "Bordeaux mixture immediately...",
  "chemical_treatment": "Metalaxyl-M + mancozeb...",
  "prevention": "Monitor daily using Late Blight DSS...",
  "recovery_days": 35,
  "is_healthy": false
}
```

### `GET /stores?lat=&lng=&radius=`
Find nearby agricultural stores.

```bash
curl "http://localhost:8000/stores?lat=28.6139&lng=77.2090&radius=10"
```

### `GET /history`
Last 20 predictions.

```bash
curl http://localhost:8000/history
```

### `GET /health`
System health check.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL for frontend |
| `MODEL_PATH` | `./models/crop_disease_model.tflite` | Path to TFLite model |
| `DB_PATH` | `./predictions.db` | SQLite database path |

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML Model | EfficientNetB0 (TFLite float16) |
| Backend | FastAPI + Python 3.10 |
| Database | SQLite + SQLAlchemy |
| Frontend | React 18 + Vite |
| Maps | Leaflet.js + OpenStreetMap |
| PWA | Service Worker + Web Manifest |
| Container | Docker + Docker Compose |
| Store Data | OpenStreetMap Overpass API |

---

## Project Structure

```
crop-disease-detection/
├── models/                          # Place .tflite model here
│   └── crop_disease_model.tflite
├── notebook/
│   └── crop_disease_training.ipynb  # Kaggle training notebook
├── backend/
│   ├── main.py                      # FastAPI app
│   ├── models.py                    # TFLite inference
│   ├── treatments.py                # Disease treatment database
│   ├── database.py                  # SQLite ORM
│   ├── schemas.py                   # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## License

MIT © 2024
