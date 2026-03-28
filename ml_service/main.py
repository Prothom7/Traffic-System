from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Avoid Intel OpenMP duplicate-runtime crash in mixed ML stacks on Windows.
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

# Ensure project root is importable when running `uvicorn main:app` inside ml_service.
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def _load_local_env_file() -> None:
    env_file = ROOT_DIR / ".env.local"
    if not env_file.exists():
        return

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        normalized_key = key.strip()
        normalized_value = value.strip().strip('"').strip("'")
        if normalized_key and normalized_key not in os.environ:
            os.environ[normalized_key] = normalized_value


_load_local_env_file()

from scripts.extract_plate_pipeline import PlatePipeline


app = FastAPI(title="Traffic System ALPR Service", version="1.0.0")

frontend_origin = os.environ.get("ALPR_FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_pipeline: Optional[PlatePipeline] = None


def _build_args_from_env() -> SimpleNamespace:
    return SimpleNamespace(
        image="",
        models_dir=os.environ.get("ALPR_MODELS_DIR", "models"),
        city_annotations=os.environ.get("ALPR_CITY_ANNOTATIONS", "annotations/city_final.json"),
        char_annotations=os.environ.get("ALPR_CHAR_ANNOTATIONS", "annotations/ocr_char.json"),
        city_label_file=os.environ.get("ALPR_CITY_LABEL_FILE", "label_city"),
        char_label_file=os.environ.get("ALPR_CHAR_LABEL_FILE", "label_char"),
    )


@app.on_event("startup")
def on_startup() -> None:
    global _pipeline
    _pipeline = PlatePipeline(_build_args_from_env())


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": _pipeline is not None}


@app.post("/predict")
async def predict(image: UploadFile = File(...)) -> dict[str, object]:
    if _pipeline is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    suffix = os.path.splitext(image.filename or "")[1] or ".jpg"
    payload = await image.read()

    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(payload)
            temp_path = temp_file.name

        result = _pipeline.run(temp_path)
        plate = str(result.get("plate", "")).strip()

        if not plate:
            raise HTTPException(status_code=422, detail="No plate text detected by the model")

        return {
            "plate": plate,
            "segments": result.get("segments", {}),
            "confidence": None,
        }
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
