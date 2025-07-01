import jwt
import requests
import logging
from django.contrib.auth import get_user_model
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()

class KindeJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        print("🔍 Debug: Authentication attempt started")
        
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        print(f"🔍 Debug: Auth header: {auth_header}")
        
        if not auth_header:
            print("❌ Debug: No authorization header found")
            return None

        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
            print(f"🔍 Debug: Token extracted (length: {len(token)})")
            print(f"🔍 Debug: Token preview: {token[:50]}...")
            
            # Get Kinde's public keys
            jwks_url = "https://ghhs.kinde.com/.well-known/jwks"
            print(f"🔍 Debug: Fetching JWKS from: {jwks_url}")
            jwks_response = requests.get(jwks_url)
            jwks = jwks_response.json()
            print(f"🔍 Debug: JWKS fetched successfully, {len(jwks['keys'])} keys found")
            
            # Decode token without verification first to get the key ID
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            key_id = unverified_payload.get('kid')
            print(f"🔍 Debug: Key ID from token: {key_id}")
            print(f"🔍 Debug: Token payload: {unverified_payload}")
            
            # Find the correct public key
            public_key = None
            
            # If no kid in token, try the first available key
            if key_id is None:
                print("🔍 Debug: No kid in token, trying first available key")
                if jwks['keys']:
                    key = jwks['keys'][0]
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    print(f"🔍 Debug: Using first available key: {key.get('kid', 'no-kid')}")
            else:
                # Try to find matching key by kid
                for key in jwks['keys']:
                    if key['kid'] == key_id:
                        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                        print(f"🔍 Debug: Found matching public key for kid: {key_id}")
                        break
            
            if not public_key:
                print(f"❌ Debug: No public key available")
                raise AuthenticationFailed('No public key available for token verification')
            
            # Verify the token
            print("🔍 Debug: Verifying token...")
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience='9b6e7df3e3ec46beb2d09a89565da00b',  # Updated to match your client ID
                issuer='https://ghhs.kinde.com'
            )
            print(f"🔍 Debug: Token verified successfully! Payload: {payload}")
            
            # Get or create user
            user_id = payload.get('sub')
            email = payload.get('email')
            print(f"🔍 Debug: User ID: {user_id}, Email: {email}")
            
            if not user_id:
                print("❌ Debug: No user ID in token payload")
                raise AuthenticationFailed('Invalid token payload')
            
            user, created = User.objects.get_or_create(
                username=user_id,
                defaults={
                    'email': email,
                    'first_name': payload.get('given_name', ''),
                    'last_name': payload.get('family_name', ''),
                }
            )
            print(f"🔍 Debug: User {'created' if created else 'found'}: {user.username}")
            
            return (user, token)
            
        except (IndexError, jwt.InvalidTokenError, requests.RequestException) as e:
            print(f"❌ Debug: Authentication failed with error: {str(e)}")
            print(f"❌ Debug: Error type: {type(e).__name__}")
            raise AuthenticationFailed(f'Invalid token: {str(e)}') 