import subprocess
import sys
import os
import time

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")
    
    print("=" * 65)
    print("🧠 Starting NeuroVision 3D - Patient-Friendly AI System")
    print("=" * 65)
    
    # 1. Start FastAPI Backend on Port 8001
    print("[1/2] Launching FastAPI Backend on http://127.0.0.1:8001...")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = backend_dir
    backend_proc = subprocess.Popen(
        [sys.executable, "run_server.py"],
        cwd=backend_dir,
        env=backend_env
    )
    
    time.sleep(3)
    
    # 2. Start Vite Frontend on Port 3000
    print("[2/2] Launching React Three.js Frontend on http://localhost:3000...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )
    
    print("\n✅ NeuroVision 3D is live!")
    print("👉 Open your browser at: http://localhost:3000")
    print("• Backend API: http://127.0.0.1:8001")
    print("\nPress Ctrl+C to terminate both servers.")
    
    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down NeuroVision 3D services...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
