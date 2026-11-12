
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse

from app.core.security import hash_password, verify_password

from app.core.session import (
    set_session_cookie,
    clear_session_cookie,
    get_session_user_id,
    set_csrf_cookie,
    clear_csrf_cookie,
    verify_csrf_protection,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================
# GET CSRF TOKEN
# ============================================================

@router.get("/csrf")
def get_csrf_token(response: Response):
    token = set_csrf_cookie(response)

    return {
        "message": "CSRF token generated successfully.",
        "csrf_token": token,
    }


# ============================================================
# REGISTER CANDIDATE
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf_protection)],
)
def register_candidate(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    full_name = data.full_name.strip()
    email = str(data.email).strip().lower()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name must contain at least 2 characters.",
        )

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(data.password),
        role=UserRole.CANDIDATE,
        is_active=True,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role.value,
        is_active=user.is_active,
    )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_csrf_protection)],
)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(data.email).strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    set_session_cookie(response, str(user.id))

    # Rotate CSRF token after successful login
    set_csrf_cookie(response)

    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role.value,
        is_active=user.is_active,
    )


# ============================================================
# LOGOUT
# ============================================================

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_csrf_protection)],
)
def logout(response: Response):
    clear_session_cookie(response)
    clear_csrf_cookie(response)

    return {
        "message": "Successfully logged out."
    }


# ============================================================
# GET CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_session_user_id(request)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive session.",
        )

    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role.value,
        is_active=user.is_active,
    )
