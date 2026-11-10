from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserLogin, UserCreate, UserOut, Token
from app.auth import (
    verify_password, hash_password, create_access_token,
    get_current_user, require_roles
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name}
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"status": "success", "message": "Logged out successfully"}

@router.post("/register", response_model=UserOut)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
