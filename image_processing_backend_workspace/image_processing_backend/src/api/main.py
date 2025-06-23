import os
from uuid import uuid4
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

from .utils import process_image, SUPPORTED_FILTERS

BASE_UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "../uploads/")
BASE_PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "../processed/")

os.makedirs(BASE_UPLOADS_DIR, exist_ok=True)
os.makedirs(BASE_PROCESSED_DIR, exist_ok=True)


app = FastAPI(
    title="Image Processing API",
    description=(
        "REST API for uploading, processing (with filters/transformations), and downloading images."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "Images", "description": "Image upload, processing, and download endpoints."}
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# PUBLIC_INTERFACE
@app.get("/", tags=["Images"], summary="Backend Health Check")
def health_check():
    """Health check for the backend service."""
    return {"message": "Healthy"}


# --- Models ---


# PUBLIC_INTERFACE
class FilterRequest(BaseModel):
    """Model for specifying filter to apply to the image."""
    filter: Literal[tuple(SUPPORTED_FILTERS)] = Field(
        ..., description="The filter/transform to apply."
    )


# --- Endpoints ---


# PUBLIC_INTERFACE
@app.post("/upload", summary="Upload an image", tags=["Images"])
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file.

    Parameters:
        file: The image to upload.

    Returns:
        The assigned image ID and filename.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file format.")
    extension = os.path.splitext(file.filename)[1]
    image_id = str(uuid4())
    target_path = os.path.join(BASE_UPLOADS_DIR, f"{image_id}{extension}")

    with open(target_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "image_id": image_id,
        "filename": file.filename,
        "url": f"/download/{image_id}{extension}"
    }


# PUBLIC_INTERFACE
@app.post("/process/{image_id}", summary="Apply filter/transformation to image", tags=["Images"])
def process_uploaded_image(
    image_id: str,
    filter_request: FilterRequest
):
    """
    Process an uploaded image by applying the specified filter or transformation.

    Parameters:
        image_id: The ID of the image to process.
        filter_request: The filter/transform to apply.

    Returns:
        Information about the processed image.
    """
    # Find the file by ID in uploads
    possible_files = [f for f in os.listdir(BASE_UPLOADS_DIR) if f.startswith(image_id)]
    if not possible_files:
        raise HTTPException(status_code=404, detail="Image not found")
    input_path = os.path.join(BASE_UPLOADS_DIR, possible_files[0])
    ext = os.path.splitext(input_path)[1]
    output_path = os.path.join(
        BASE_PROCESSED_DIR, f"{image_id}_{filter_request.filter}{ext}"
    )
    try:
        process_image(input_path, output_path, filter_request.filter)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
    return {
        "processed_image_url": f"/download/processed/{image_id}_{filter_request.filter}{ext}"
    }


# PUBLIC_INTERFACE
@app.get("/download/{filename}", summary="Download uploaded image", tags=["Images"])
def download_image(filename: str):
    """
    Download an image file (uploaded version).

    Parameters:
        filename: The filename (with extension).

    Returns:
        The image file as a response.
    """
    file_path = os.path.join(BASE_UPLOADS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=filename
    )


# PUBLIC_INTERFACE
@app.get("/download/processed/{filename}", summary="Download processed image", tags=["Images"])
def download_processed_image(filename: str):
    """
    Download a processed (filtered/transformed) image file.

    Parameters:
        filename: The processed image filename.

    Returns:
        The processed image file as a response.
    """
    file_path = os.path.join(BASE_PROCESSED_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Processed image not found")
    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=filename
    )


# PUBLIC_INTERFACE
@app.get("/filters", summary="List available filters", tags=["Images"])
def list_available_filters():
    """
    List all filters/transformations that can be applied via the process endpoint.
    """
    return {"filters": SUPPORTED_FILTERS}
