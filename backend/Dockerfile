# Use a lightweight Python image
FROM python:3.10-slim

# Install system dependencies for OpenCV and DeepFace
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Create directory for face images
RUN mkdir -p data/face_images

# Expose the port Hugging Face expects
EXPOSE 7860

# Command to run the app
# Hugging Face usually provides the $PORT environment variable, but 7860 is standard
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
