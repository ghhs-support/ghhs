from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.conf import settings
from django.shortcuts import redirect
import requests
import secrets
import base64
from urllib.parse import unquote, urljoin, quote

@api_view(['GET'])
@permission_classes([AllowAny])
def login_view(request):
    """Redirect to Kinde login page"""
    # Generate a secure random state
    state = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
    request.session['oauth_state'] = state  # Store raw state
    
    kinde_auth_url = f"{settings.KINDE_ISSUER_URL}/oauth2/auth"
    # Use the base callback URL
    callback_url = settings.KINDE_CALLBACK_URL
    params = {
        'client_id': settings.KINDE_CLIENT_ID,
        'redirect_uri': callback_url,
        'response_type': 'code',
        'scope': 'openid profile email',
        'state': quote(state),  # URL encode state only when adding to URL
        'prompt': 'login',  # Force login prompt
    }
    return redirect(f"{kinde_auth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}")

@api_view(['GET', 'OPTIONS'])
@permission_classes([AllowAny])
def callback(request):
    """Handle Kinde callback"""
    if request.method == 'OPTIONS':
        response = Response()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    # Verify state parameter
    state = unquote(request.GET.get('state', ''))  # Unquote the received state
    stored_state = request.session.get('oauth_state')
    
    # Debug logging
    print(f"Received state: {state}")
    print(f"Stored state: {stored_state}")
    
    if not state or not stored_state:
        return Response({'error': 'Missing state parameter'}, status=400)
    
    # Compare the unquoted received state with stored state
    if state != stored_state:
        print(f"State mismatch - Received: {state}, Stored: {stored_state}")  # Debug log
        return Response({'error': 'Invalid state parameter'}, status=400)
    
    # Clear the state from session
    request.session.pop('oauth_state', None)
    
    code = request.GET.get('code')
    if not code:
        return Response({'error': 'No code provided'}, status=400)

    # Exchange code for token
    token_url = f"{settings.KINDE_ISSUER_URL}/oauth2/token"
    # Use the base callback URL
    callback_url = settings.KINDE_CALLBACK_URL
    token_data = {
        'client_id': settings.KINDE_CLIENT_ID,
        'client_secret': settings.KINDE_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': callback_url,
    }
    
    response = requests.post(token_url, data=token_data)
    if response.status_code != 200:
        return Response({'error': 'Failed to get token'}, status=400)

    token = response.json().get('access_token')
    user = authenticate(request, token=token)
    
    if user:
        login(request, user)
        return redirect('/admin/')  # Redirect to admin after successful login
    
    return Response({'error': 'Authentication failed'}, status=401)

@api_view(['GET', 'POST'])
def logout_view(request):
    """Handle logout"""
    # Clear Django session
    logout(request)
    request.session.flush()
    
    # Construct Kinde logout URL with post_logout_redirect_uri
    kinde_logout_url = f"{settings.KINDE_ISSUER_URL}/logout"
    # Use the base callback URL
    callback_url = settings.KINDE_CALLBACK_URL
    params = {
        'post_logout_redirect_uri': callback_url,
        'client_id': settings.KINDE_CLIENT_ID,
        'logout_hint': 'force',  # Force logout
    }
    
    # Redirect to Kinde logout endpoint
    return redirect(f"{kinde_logout_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}")