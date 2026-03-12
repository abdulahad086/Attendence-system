# Deploying AttendAI to production

Follow these steps to take AttendAI from your local machine to the cloud.

## 1. Frontend Deployment (Vercel)
Vercel is the best home for React/Vite applications.

1.  **Push to GitHub**: Initialize a git repo and push your code to GitHub.
2.  **Connect Vercel**: Import your repository into [Vercel](https://vercel.com).
3.  **Environment Variables**:
    *   Set `VITE_API_BASE_URL` to your Backend URL.
4.  **Deploy**: Vercel will automatically build and provide a `https://attend-ai.vercel.app` link.

## 2. Backend Deployment (Railway.app)
Railway is easy for FastAPI + PostgreSQL.

1.  **Create New Project**: Select "Deploy from GitHub repo".
2.  **Add Database**: Add a "PostgreSQL" service in the same project. Railway will automatically inject the `DATABASE_URL`.
3.  **Environment Variables**:
    *   `SECRET_KEY`: A long random string.
    *   `SIMILARITY_THRESHOLD`: `0.40`
    *   `FACE_IMAGES_DIR`: `/app/data/face_images`
4.  **Networking**: Set the port to `8000`.

## 3. Database Migration
In local, we use `create_tables()` on startup. In production:
1.  Railway will provide the connection string.
2.  The backend will automatically create tables on first run in the cloud database.

## 4. Scaling the AI
Face recognition is CPU/RAM intensive.
*   **Production Tip**: Use a server with at least 2GB RAM and 2 CPUs for smooth performance with DeepFace.
*   **Image Storage**: For many users, consider using AWS S3 or Google Cloud Storage instead of local `/data/face_images`.

## 5. Domain & HTTPS
*   Once deployed, connect your commercial domain (e.g., `attendai.pk`) in Vercel and Railway settings. HTTPS will be provided automatically.
