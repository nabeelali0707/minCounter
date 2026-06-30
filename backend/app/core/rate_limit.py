import time
from fastapi import HTTPException, Request, status

# Simple in-memory rate limiter
# Key: (ip/username, rate_limit_type) -> list of timestamps
rate_limits = {}

def rate_limit(requests: int, window_seconds: int):
    """
    Simple sliding-window rate limiting decorator/dependency.
    """
    def dependency(request: Request):
        # Identify requester by IP address
        ip = request.client.host if request.client else "unknown"
        # We can also check for user from state if authenticated
        username = getattr(request.state, "user", None)
        key = f"rate:{username or ip}"
        
        now = time.time()
        # Initialize if not present
        if key not in rate_limits:
            rate_limits[key] = []
            
        # Filter timestamps outside the window
        rate_limits[key] = [t for t in rate_limits[key] if now - t < window_seconds]
        
        if len(rate_limits[key]) >= requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Limit is {requests} requests per {window_seconds} seconds."
            )
            
        rate_limits[key].append(now)
        return True
    return dependency
