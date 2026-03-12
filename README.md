---
title: Attend Backend
emoji: 🏢
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# AttendAI — AI Face Recognition Attendance System

> **Production-ready** attendance management system using live face recognition via OpenCV + DeepFace (ArcFace), FastAPI backend, PostgreSQL database, and a React/TailwindCSS admin dashboard.

---

## 🏗 Project Structure

```
attend/
├── backend/                   # FastAPI application
│   ├── main.py                # App entry-point + WebSocket camera feed
│   ├── config.py              # Settings (pydantic-settings, .env)
│   ├── database/
│   │   ├── connection.py      # SQLAlchemy engine + session factory
│   │   └── models.py          # User, FaceEmbedding, AttendanceLog ORM models
│   ├── routes/
│   │   ├── users.py           # /api/users — register, list, delete
│   │   └── attendance.py      # /api/attendance — mark, logs, report, CSV
│   ├── services/
│   │   ├── face_service.py    # Detection → embedding → matching pipeline
│   │   └── attendance_service.py  # Mark + cooldown guard + reporting
│   ├── face_recognition/
│   │   ├── detector.py        # OpenCV DNN + Haar Cascade fallback
│   │   └── embedder.py        # DeepFace ArcFace embeddings + cosine match
│   ├── utils/
│   │   ├── logger.py          # Loguru structured logging
│   │   └── helpers.py         # base64 ↔ frame helpers
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/                  # React + TailwindCSS dashboard
│   ├── src/
│   │   ├── App.jsx            # Router + sidebar layout
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Stats + area chart + recent activity
│   │   │   ├── LiveCamera.jsx     # WebRTC webcam → WebSocket recognition
│   │   │   ├── UsersPage.jsx      # User management + registration modal
│   │   │   ├── AttendancePage.jsx # Paginated logs + CSV export
│   │   │   └── ReportsPage.jsx    # Pie + bar charts, attendance rate
│   │   └── utils/api.js       # Axios API client
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
└── docker-compose.yml
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Uvicorn |
| Face Detection | OpenCV DNN (res10 SSD) / Haar Cascade fallback |
| Face Recognition | DeepFace + ArcFace model (512-d embeddings) |
| Similarity | Cosine distance via scikit-learn |
| Database | PostgreSQL 15 + SQLAlchemy ORM |
| Frontend | React 18 + Vite + TailwindCSS + Recharts |
| Real-time | WebSocket (FastAPI native) |
| Logging | Loguru (console + rotating file) |
| Containerisation | Docker + Docker Compose |

---

## 🗄 Database Schema

```sql
-- Users
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(200) UNIQUE,
    department VARCHAR(120),
    role       VARCHAR(80) DEFAULT 'employee',
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Face embeddings (512-d ArcFace vectors stored as JSON)
CREATE TABLE face_embeddings (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    embedding  TEXT NOT NULL,           -- JSON array[float]
    image_path VARCHAR(300),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance logs
CREATE TABLE attendance_logs (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    timestamp  TIMESTAMP NOT NULL,
    date       DATE NOT NULL,
    status     VARCHAR(20) DEFAULT 'present',  -- present | late
    confidence FLOAT
);
```

---

## 🚀 Running Locally (Without Docker)

### 1. Prerequisites

```bash
# Python 3.11+, Node 20+, PostgreSQL 15+
brew install python@3.11 node postgresql@15
```

### 2. Database Setup

```bash
psql -U postgres
CREATE USER attend_user WITH PASSWORD 'attend_pass';
CREATE DATABASE attendance_db OWNER attend_user;
\q
```

### 3. Backend

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
pip install -r requirements.txt

# Start the server (auto-creates tables on startup)
uvicorn main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc:      http://localhost:8000/redoc

### 4. Frontend

```bash
cd frontend
npm install
npm run dev                  # runs on http://localhost:3000
```

---

## 🐳 Running with Docker Compose

```bash
# 1. Copy and edit env
cp backend/.env.example backend/.env

# 2. Build and start all services
docker compose up --build

# Services:
#   http://localhost:3000  → React dashboard
#   http://localhost:8000  → FastAPI + Swagger
#   localhost:5432         → PostgreSQL
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/register` | Register user + upload face images |
| `GET`  | `/api/users` | List all active users |
| `GET`  | `/api/users/{id}` | Get user details |
| `DELETE` | `/api/users/{id}` | Soft-delete user |
| `POST` | `/api/users/{id}/add-images` | Add more face images |
| `POST` | `/api/attendance/mark` | Identify face + mark attendance |
| `GET`  | `/api/attendance/logs` | Query logs (date, user_id filters) |
| `GET`  | `/api/attendance/daily-report` | Daily stats summary |
| `GET`  | `/api/attendance/export` | Download CSV |
| `WS`   | `/ws/camera` | Real-time frame recognition stream |
| `GET`  | `/health` | Health check |

---

## 🔌 WebSocket Protocol

**Client → Server**
```json
{ "frame": "data:image/jpeg;base64,..." }
```

**Server → Client**
```json
{
  "detected": 2,
  "results": [
    { "user_id": 1, "name": "John Doe", "similarity": 0.94, "status": "present", "bbox": [100, 50, 200, 200] },
    { "user_id": null, "name": "Unknown", "similarity": null, "status": "unknown", "bbox": [400, 60, 180, 180] }
  ],
  "annotated_frame": "data:image/jpeg;base64,..."
}
```

---

## 🔧 Configuration (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | local postgres | PostgreSQL connection string |
| `DEEPFACE_MODEL` | `ArcFace` | Face recognition model |
| `SIMILARITY_THRESHOLD` | `0.40` | Cosine distance threshold |
| `ATTENDANCE_COOLDOWN_MINUTES` | `5` | Duplicate entry prevention window |
| `MIN_FACE_SIZE` | `60` | Minimum face px size |
| `FACE_IMAGES_DIR` | `data/face_images` | Where captured faces are saved |

---

## 🚧 Known First-Run Notes

1. **DeepFace model download**: On first run, DeepFace will automatically download the ArcFace model weights (~250 MB). This only happens once.
2. **DNN detector**: Place `deploy.prototxt` and `res10_300x300_ssd_iter_140000.caffemodel` in `backend/face_recognition/models/` for best accuracy. Without them, Haar Cascade is used.
3. **GPU acceleration**: Install `tensorflow-gpu` and CUDA to dramatically speed up embedding generation.

---

## 🛣 Future Improvements

- [ ] JWT authentication + role-based access control
- [ ] Redis cache for in-memory embedding lookups (10× faster)
- [ ] Anti-spoofing liveness detection (Silent-Face-Anti-Spoofing)
- [ ] Multi-camera support with camera ID routing
- [ ] Email/Slack notifications for late/absent employees
- [ ] Mobile app (React Native) using the REST API
- [ ] Kubernetes deployment with horizontal pod autoscaling
- [ ] GPU-accelerated TensorRT inference for edge devices
