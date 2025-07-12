"""
Rate limiting middleware for authentication endpoints
"""
import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import asyncio
from collections import defaultdict, deque

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware specifically for authentication endpoints
    
    Uses sliding window rate limiting with in-memory storage.
    In production, consider using Redis for distributed systems.
    """
    
    def __init__(self, app, max_requests: int = 5, window_seconds: int = 900):  # 5 requests per 15 minutes
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Store request timestamps for each IP
        self.request_times: Dict[str, deque] = defaultdict(lambda: deque())
        # Lock for thread safety
        self._lock = asyncio.Lock()
    
    async def dispatch(self, request: Request, call_next):
        # Only apply rate limiting to auth endpoints
        if not self._is_auth_endpoint(request.url.path):
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        
        async with self._lock:
            current_time = time.time()
            
            # Clean old requests outside the window
            self._clean_old_requests(client_ip, current_time)
            
            # Check if rate limit exceeded
            if len(self.request_times[client_ip]) >= self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {self.max_requests} attempts per {self.window_seconds // 60} minutes.",
                    headers={"Retry-After": str(self.window_seconds)}
                )
            
            # Record this request
            self.request_times[client_ip].append(current_time)
        
        return await call_next(request)
    
    def _is_auth_endpoint(self, path: str) -> bool:
        """Check if the path is an authentication endpoint"""
        auth_endpoints = ["/auth/token", "/auth/login", "/auth/register"]
        return any(path.startswith(endpoint) for endpoint in auth_endpoints)
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address, handling proxy headers"""
        # Check for forwarded headers (useful behind reverse proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def _clean_old_requests(self, client_ip: str, current_time: float):
        """Remove requests outside the sliding window"""
        cutoff_time = current_time - self.window_seconds
        
        # Remove old timestamps
        while (self.request_times[client_ip] and 
               self.request_times[client_ip][0] < cutoff_time):
            self.request_times[client_ip].popleft()