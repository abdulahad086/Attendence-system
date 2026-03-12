# Deploying AttendAI (Free Cloud Hosting)

Follow these steps to take AttendAI live for free.

## 1. Frontend Deployment (Vercel)
1.  Push code to GitHub.
2.  Import to [Vercel](https://vercel.com).
3.  Set `VITE_API_BASE_URL` to your Render URL.

## 2. Database (Neon.tech)
1.  Sign up at [Neon](https://neon.tech).
2.  Create a project and get your `DATABASE_URL`.

## 3. Backend (Hugging Face Spaces) - *100% Free*
Hugging Face Spaces is great for AI/FastAPI apps and doesn't require a credit card.

1.  Go to [Hugging Face](https://huggingface.co/new-space).
2.  **Space name**: `attend-backend`
3.  **SDK**: Select **Docker**.
4.  **Template**: Select **Blank**.
5.  **Visibility**: Public (to allow frontend access).
6.  **Settings (Secrets)**:
    *   `DATABASE_URL`: `postgresql://neondb_owner:npg_p4EsOJgTN1Ym@ep-rapid-cherry-adi1qp8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
    *   `SECRET_KEY`: `AttendAI_Secure_2026_Key`
7.  **Push code**: Push your repo. Hugging Face will use the `backend/Dockerfile` I created.

## 4. Final Connection
After Hugging Face deploys, copy its URL (e.g., `https://abdulahad086-attend-backend.hf.space`).
1.  Go to **Vercel** Settings.
2.  Update `VITE_API_BASE_URL` with this URL.
3.  **Redeploy** the frontend.

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
