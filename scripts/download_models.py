import os
import requests
from pathlib import Path

def download_file(url, dest):
    if dest.exists():
        print(f"Skipping {dest.name}, already exists.")
        return
    print(f"Downloading {url} ...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Successfully downloaded {dest.name}")

if __name__ == "__main__":
    base_url = "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/"
    models_dir = Path(__file__).parent / "backend" / "face_recognition" / "models"
    
    files = [
        ("deploy.prototxt", base_url + "deploy.prototxt"),
        ("res10_300x300_ssd_iter_140000.caffemodel", base_url + "res10_300x300_ssd_iter_140000.caffemodel")
    ]
    
    for filename, url in files:
        download_file(url, models_dir / filename)
