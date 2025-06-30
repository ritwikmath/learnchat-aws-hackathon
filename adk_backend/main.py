import os

import uvicorn
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.sessions import DatabaseSessionService

# Get the directory where main.py is located
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Example allowed origins for CORS
ALLOWED_ORIGINS = ["http://localhost", "http://localhost:3000", "*"]
# Set web=True if you intend to serve a web interface, False otherwise
SERVE_WEB_INTERFACE = True

# Call the function to get the FastAPI app instance
app = get_fast_api_app(
    agents_dir=AGENT_DIR,
    allow_origins=ALLOWED_ORIGINS,
    web=SERVE_WEB_INTERFACE,
    session_service_uri="sqlite:///./sessions.db"
)

if __name__ == "__main__":
    # Use the PORT environment variable provided by Cloud Run, defaulting to 8080
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))