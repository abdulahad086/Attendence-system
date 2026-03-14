import os
import requests
from pathlib import Path

def download_file(url, dest):
    if dest.exists():
        print(f"Skipping {dest.name}, already exists at {dest}")
        return
    print(f"Downloading {url} to {dest} ...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Successfully downloaded {dest.name}")

if __name__ == "__main__":
    # Verified working URLs found by subagent
    files = [
        (
            "deploy.prototxt", 
            "https://huggingface.co/Durraiya/deploy.prototxt/resolve/main/deploy.prototxt"
        ),
        (
            "res10_300x300_ssd_iter_140000.caffemodel", 
            "https://huggingface.co/Durraiya/res10_300x300_ssd_iter_140000_fp16.caffemodel/resolve/main/res10_300x300_ssd_iter_140000_fp16.caffemodel"
        )
    ]
    
    # Resolve project root (script is in scripts/download_models.py)
    script_dir = Path(__file__).parent.resolve()
    project_root = script_dir.parent
    
    # Target directory for models
    models_dir = project_root / "backend" / "face_recognition" / "models"
    
    # Fallback: if backend doesn't exist relative to script, try relative to CWD
    if not (project_root / "backend").exists():
        models_dir = Path.cwd() / "backend" / "face_recognition" / "models"

    print(f"Target models directory: {models_dir}")
    
    for filename, url in files:
        download_file(url, models_dir / filename)
