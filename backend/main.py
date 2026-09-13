from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from app.api import documents, auth

app = FastAPI(title="CareDoc AI API", version="1.0.0")

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
