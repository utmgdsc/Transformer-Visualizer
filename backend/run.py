#!/usr/bin/env python3
"""
Production server runner for Render deployment
"""
import uvicorn
import os
from config import settings

if __name__ == "__main__":
    # Debug: Print the port we're trying to use
    port = int(os.getenv("PORT", settings.port))
    host = settings.host
    
    print(f"Starting server on {host}:{port}")
    print(f"PORT env var: {os.getenv('PORT')}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info",
        access_log=True
    )
