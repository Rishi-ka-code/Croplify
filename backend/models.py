import os
import numpy as np
from pathlib import Path
from typing import Tuple, List, Optional
from PIL import Image
import io

MODEL_SEARCH_PATHS = [
    "./models/crop_disease_model.tflite",
    "./crop_disease_model.tflite",
    "/app/models/crop_disease_model.tflite",
]

CLASS_NAMES: List[str] = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

_interpreter = None
_input_details = None
_output_details = None


def load_model() -> bool:
    global _interpreter, _input_details, _output_details

    model_path = os.getenv("MODEL_PATH", "")
    search_paths = [model_path] + MODEL_SEARCH_PATHS if model_path else MODEL_SEARCH_PATHS

    for path in search_paths:
        if path and Path(path).exists():
            try:
                try:
                    import tflite_runtime.interpreter as tflite
                    _interpreter = tflite.Interpreter(model_path=str(path))
                except ImportError:
                    try:
                        import tensorflow as tf
                        _interpreter = tf.lite.Interpreter(model_path=str(path))
                    except ImportError:
                        print("WARNING: tflite_runtime and tensorflow not installed. Install via: pip install tensorflow")
                        return False

                _interpreter.allocate_tensors()
                _input_details = _interpreter.get_input_details()
                _output_details = _interpreter.get_output_details()
                print(f"Model loaded from: {path}")
                print(f"Input shape: {_input_details[0]['shape']}")
                return True
            except Exception as e:
                print(f"Error loading model from {path}: {e}")
                continue

    print("WARNING: No TFLite model found or TFLite not available. Predictions will fail.")
    return False


def is_model_loaded() -> bool:
    return _interpreter is not None


def preprocess_image(image_bytes: bytes, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(target_size, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def predict(image_bytes: bytes, confidence_threshold: float = 0.4) -> Tuple[str, float]:
    if _interpreter is None:
        raise RuntimeError("Model not loaded. Place crop_disease_model.tflite in backend/models/")

    input_data = preprocess_image(image_bytes)
    _interpreter.set_tensor(_input_details[0]["index"], input_data)
    _interpreter.invoke()
    probs = _interpreter.get_tensor(_output_details[0]["index"])[0]

    max_prob = float(np.max(probs))
    pred_idx = int(np.argmax(probs))

    if max_prob < confidence_threshold:
        return "Unknown", max_prob

    return CLASS_NAMES[pred_idx], max_prob