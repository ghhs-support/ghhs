from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.conf import settings
import requests

class KindeBackend(ModelBackend):
    def authenticate(self, request, token=None):
        if not token:
            return None

        try:
            headers = {
                'Authorization': f'Bearer {token}'
            }
            response = requests.get(f'{settings.KINDE_ISSUER_URL}/oauth2/v2/user_profile', headers=headers)
            
            if response.status_code != 200:
                return None

            user_data = response.json()
            User = get_user_model()
            
            # Get or create user
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['email'],
                    'first_name': user_data.get('given_name', ''),
                    'last_name': user_data.get('family_name', ''),
                    'is_staff': True, 
                    'is_superuser': True 
                }
            )
            
            return user
        except Exception as e:
            print(f"Authentication error: {e}")
            return None