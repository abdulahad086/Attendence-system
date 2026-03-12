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

# Set up a new user 'user' with UID 1000
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy the rest of the backend code
COPY --chown=user:user . .

# Create writable directories
RUN mkdir -p logs data/face_images

# Expose the port Hugging Face expects
EXPOSE 7860

# Command to run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
