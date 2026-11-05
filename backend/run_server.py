import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting NeuroVision 3D Backend on http://127.0.0.1:8001...", flush=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=False)
