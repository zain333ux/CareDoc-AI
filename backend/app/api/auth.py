from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.core.db import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def sign_up(request: AuthRequest):
    """
    Creates a new user with email_confirm=True via Supabase admin API
    to bypass free-tier email delivery limits, then signs them in.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database/Auth client is not configured.")
    
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    try:
        # Create user with auto-confirmed email
        created = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True
        })
        user = created.user if hasattr(created, "user") else created
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "unique" in error_msg.lower():
            raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
        raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")

    # Immediately sign in to produce an active session
    try:
        session_resp = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "status": "success",
            "message": "Account created successfully.",
            "user": {
                "id": session_resp.user.id,
                "email": session_resp.user.email
            },
            "session": {
                "access_token": session_resp.session.access_token,
                "refresh_token": session_resp.session.refresh_token
            }
        }
    except Exception as e:
        # If automatic sign-in fails for any reason, return the created user info
        return {
            "status": "success",
            "message": "Account created successfully. Please log in.",
            "user": {
                "id": user.id,
                "email": user.email
            },
            "session": None
        }

@router.post("/login")
async def log_in(request: AuthRequest):
    """
    Authenticates a user with email and password, returning an active session.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database/Auth client is not configured.")

    try:
        session_resp = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "status": "success",
            "user": {
                "id": session_resp.user.id,
                "email": session_resp.user.email
            },
            "session": {
                "access_token": session_resp.session.access_token,
                "refresh_token": session_resp.session.refresh_token
            }
        }
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower() or "credentials" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password. Please try again.")
        raise HTTPException(status_code=401, detail=f"Login failed: {error_msg}")

@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """
    Returns the currently authenticated user based on the Bearer access token.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database/Auth client is not configured.")
        
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = authorization.split("Bearer ")[1].strip()
    try:
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")
        return {
            "user": {
                "id": user_resp.user.id,
                "email": user_resp.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Session verification failed: {str(e)}")
