from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import requests

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
            # Token is valid, set a session flag and redirect to admin
            request.session['kinde_authenticated'] = True
            request.session['kinde_user'] = response.json()
            return JsonResponse({'success': True, 'redirect_url': '/admin/'})
        else:
            return JsonResponse({'error': 'Invalid token'}, status=401)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/admin-access/', admin_access, name='admin_access'),
]
