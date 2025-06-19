from django.shortcuts import redirect
from django.http import JsonResponse
import requests
import json

class AdminLoginRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/admin/'):
            # Check for Kinde authentication in session (set by admin_access endpoint)
            kinde_authenticated = request.session.get('kinde_authenticated', False)
            
            # Debug logging
            print(f"Admin access attempt - Kinde session: {kinde_authenticated}, Django auth: {request.user.is_authenticated}")
            
            # Check if user is authenticated via Kinde session or Django
            if kinde_authenticated or request.user.is_authenticated:
                if kinde_authenticated:
                    print("Allowing access via Kinde session authentication")
                else:
                    print("Allowing access via Django authentication")
                return self.get_response(request)
            else:
                print("No authentication found, redirecting to login")
                return redirect('http://localhost:5173/signin')
        
        return self.get_response(request)