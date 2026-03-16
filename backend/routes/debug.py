from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
import os

router = APIRouter(prefix="/debug", tags=["Debug"])

@router.get("/logs")
def get_logs():
    try:
        log_files = os.listdir("logs")
        if not log_files:
            return "No logs"
        
        latest = sorted(log_files)[-1]
        with open(os.path.join("logs", latest), "r") as f:
            return f.read()[-5000:]
    except Exception as e:
        return str(e)
