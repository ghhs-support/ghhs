from django.contrib import admin
from django.urls import path, include, re_path
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.views.generic import TemplateView
import requests
from django.conf import settings
from django.conf.urls.static import static

@csrf_exempt
def kinde_config(request):
    """Endpoint to provide Kinde configuration to frontend"""
    return JsonResponse({
        'clientId': '9b6e7df3e3ec46beb2d09a89565da00b',  # Use React frontend client ID
        'domain': 'https://ghhs.kinde.com',
    })

@csrf_exempt
@require_http_methods(["POST"])
def token_exchange(request):
    """Handle token exchange with Kinde"""
    try:
        import json
        data = json.loads(request.body)
        code = data.get('code')
        
        if not code:
            return JsonResponse({'error': 'No code provided'}, status=400)
            
        # Exchange code for token with Kinde using React frontend client ID
        # Note: React frontend apps don't have client secrets, so we use PKCE flow
        response = requests.post(
            'https://ghhs.kinde.com/oauth2/token',
            data={
                'grant_type': 'authorization_code',
                'client_id': '9b6e7df3e3ec46beb2d09a89565da00b',  # React frontend client ID
                'code': code,
                'redirect_uri': 'https://ghhs.fly.dev',  # Production redirect URI
                # No client_secret for frontend apps
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return JsonResponse(response.json())
        else:
            return JsonResponse(
                {'error': 'Token exchange failed', 'details': response.text}, 
                status=response.status_code
            )
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def admin_access(request):
    """Secure endpoint to validate Kinde token and grant admin access"""
    try:
        # Get token from request body
        import json
        data = json.loads(request.body)
        token = data.get('token')
        
        if not token:
            return JsonResponse({'error': 'No token provided'}, status=400)
        
        # Verify token with Kinde
        response = requests.get(
            'https://ghhs.kinde.com/oauth2/v2/user_profile',
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        
        if response.status_code == 200:
            user_data = response.json()
            
            # Get or create Django user based on Kinde user data
            email = user_data.get('email')
            if not email:
                return JsonResponse({'error': 'No email found in user profile'}, status=400)
            
            # Try to get existing user by email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create new user if doesn't exist
                username = user_data.get('id', email.split('@')[0])
                first_name = user_data.get('given_name', '')
                last_name = user_data.get('family_name', '')
                
                # Ensure username is unique
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=None  # No password for Kinde users
                )
                # Make user staff and superuser for admin access
                user.is_staff = True
                user.is_superuser = True
                user.save()
            
            # Log the user into Django's authentication system
            login(request, user)
            
            # Set session flag for middleware
            request.session['kinde_authenticated'] = True
            request.session['kinde_user'] = user_data
            
            return JsonResponse({'success': True, 'redirect_url': '/admin/'})
        else:
            return JsonResponse({'error': 'Invalid token'}, status=401)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Serve frontend for all non-API routes
def serve_frontend(request):
    return TemplateView.as_view(template_name='index.html')(request)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/admin-access/', admin_access, name='admin_access'),
    path('api/kinde-config/', kinde_config, name='kinde_config'),
    path('api/token-exchange/', token_exchange, name='token_exchange'),
    path('api/', include('alarms.urls')),  # Add alarms URLs under /api/ prefix
    
    # Serve React App - catch all routes and let React handle routing
    re_path(r'^(?!api/)(?!admin/)(?!media/)(?!static/).*$', TemplateView.as_view(template_name='index.html')),
]

# Add static and media files serving
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
