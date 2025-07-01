from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
import requests

def validate_kinde_token(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'No valid authorization header'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify token with Kinde
            response = requests.get(
                'https://ghhs.kinde.com/oauth2/v2/user_profile',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10
            )
            
            if response.status_code != 200:
                return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_data = response.json()
            
            # Get or create Django user based on Kinde user data
            email = user_data.get('email')
            if not email:
                return Response({'error': 'No email found in user profile'}, status=status.HTTP_400_BAD_REQUEST)
            
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
            
            # Add the user to the request
            request.user = user
            return view_func(request, *args, **kwargs)
                
        except requests.RequestException:
            return Response({'error': 'Failed to validate token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': 'Authentication failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    return wrapper 