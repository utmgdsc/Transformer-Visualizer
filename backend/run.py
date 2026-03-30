#!/usr/bin/env python3
"""
Production server runner for Render deployment
"""
import uvicorn
from config import settings

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level="info",
        access_log=True
    )
