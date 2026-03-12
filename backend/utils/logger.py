"""
utils/logger.py
---------------
Loguru-based logger with structured output.
"""

import sys
from loguru import logger

# Remove default handler and configure a readable format
logger.remove()
logger.add(
    sys.stderr,
    level="DEBUG",
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level:<8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> — "
        "<level>{message}</level>"
    ),
    colorize=True,
)

# Also log to file with rotation
logger.add(
    "logs/app.log",
    level="INFO",
    rotation="10 MB",
    retention="7 days",
    compression="gz",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {name}:{function}:{line} — {message}",
)

__all__ = ["logger"]
