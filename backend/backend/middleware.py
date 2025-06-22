from django.shortcuts import redirect
from django.http import JsonResponse
import requests
import json
import logging
import traceback

logger = logging.getLogger('django.request')

class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log request information
        logger.debug(f"[Request] {request.method} {request.path}")
        logger.debug(f"[Headers] {dict(request.headers)}")
        
        try:
            response = self.get_response(request)
            
            # Log response information for errors
            if response.status_code >= 400:
                logger.error(f"[Response] Status: {response.status_code}")
                if hasattr(response, 'content'):
                    logger.error(f"[Response Content] {response.content.decode('utf-8')}")
            
            return response
            
        except Exception as e:
            # Log any unhandled exceptions
            logger.error(f"[Unhandled Exception] {str(e)}")
            logger.error(f"[Traceback] {''.join(traceback.format_exc())}")
            raise

class AdminLoginRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/admin/'):
            # Check for Kinde authentication in session (set by admin_access endpoint)
            kinde_authenticated = request.session.get('kinde_authenticated', False)
            
            # Debug logging
            logger.debug(f"Admin access attempt - Path: {request.path}")
            logger.debug(f"  - Kinde session: {kinde_authenticated}")
            logger.debug(f"  - Django auth: {request.user.is_authenticated}")
            logger.debug(f"  - User: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
            logger.debug(f"  - Session keys: {list(request.session.keys())}")
            
            # Check if user is authenticated via Kinde session or Django
            if kinde_authenticated or request.user.is_authenticated:
                if kinde_authenticated:
                    logger.info("  ✓ Allowing access via Kinde session authentication")
                else:
                    logger.info("  ✓ Allowing access via Django authentication")
                return self.get_response(request)
            else:
                logger.warning("  ✗ No authentication found, redirecting to login")
                return redirect('http://localhost:5173/signin')
        
        return self.get_response(request)