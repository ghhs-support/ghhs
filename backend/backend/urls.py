from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
import requests
from maintenance.views import beeping_alarms

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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/admin-access/', admin_access, name='admin_access'),
    path('api/beeping_alarms/', beeping_alarms, name='beeping_alarms'),
    path('api/common/', include('common.urls')),
]
