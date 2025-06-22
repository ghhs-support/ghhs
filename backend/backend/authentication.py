from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from django.core.cache import cache
import requests
from django.conf import settings
import hashlib
import logging

logger = logging.getLogger(__name__)

class KindeAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # Get the token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        
        # Create a cache key based on token hash
        token_hash = hashlib.sha256(token.encode()).hexdigest()[:16]
        cache_key = f"kinde_user_{token_hash}"
        
        # Try to get user from cache first
        cached_user = cache.get(cache_key)
        if cached_user:
            try:
                user = User.objects.get(id=cached_user['user_id'])
                return (user, None)
            except User.DoesNotExist:
                # User was deleted, remove from cache
                cache.delete(cache_key)

        # Verify token with Kinde
        try:
            logger.debug(f"Verifying token with Kinde for user profile")
            response = requests.get(
                'https://ghhs.kinde.com/oauth2/v2/user_profile',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10
            )

            if response.status_code != 200:
                logger.warning(f"Kinde token verification failed with status {response.status_code}")
                raise AuthenticationFailed('Invalid token')

            user_data = response.json()
            email = user_data.get('email')

            if not email:
                logger.error("No email found in Kinde user profile")
                raise AuthenticationFailed('No email found in user profile')

            # Get or create user
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create new user
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
                logger.info(f"Created new user: {user.email}")

            # Cache the user for 5 minutes to avoid repeated Kinde calls
            cache.set(cache_key, {'user_id': user.id, 'email': user.email}, timeout=300)
            logger.debug(f"Cached user authentication for {user.email}")
            
            return (user, None)

        except requests.RequestException as e:
            logger.error(f"Network error verifying token with Kinde: {str(e)}")
            # Check if we can fall back to cached user data
            cached_user = cache.get(cache_key)
            if cached_user:
                try:
                    user = User.objects.get(id=cached_user['user_id'])
                    logger.warning(f"Using cached auth for {user.email} due to network error")
                    return (user, None)
                except User.DoesNotExist:
                    pass
            
            raise AuthenticationFailed('Failed to verify token')
        except Exception as e:
            logger.error(f"Unexpected error in authentication: {str(e)}")
            raise AuthenticationFailed('Authentication error') 