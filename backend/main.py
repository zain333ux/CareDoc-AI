from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from groq import RateLimitError
import math
from dotenv import load_dotenv
load_dotenv()
from app.api import documents, auth

app = FastAPI(title="CareDoc AI API", version="1.0.0")

@app.exception_handler(RateLimitError)
async def ai_rate_limit_handler(request, exc):
    try:
        seconds = max(1, math.ceil(float(exc.response.headers.get("retry-after", "60"))))
    except (ValueError, OverflowError):
        seconds = 60
    minutes = math.ceil(seconds / 60)
    return JSONResponse(
        status_code=429,
        headers={"Retry-After": str(seconds)},
        content={"detail": f"The AI service has reached its free usage limit. Please wait at least {minutes} minute(s) before trying again. Availability depends on the shared quota recovering.", "code": "ai_rate_limit", "retry_after": seconds},
    )

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with the Vercel domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CareDoc AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
