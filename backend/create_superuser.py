import os
import django
import sys
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
import requests
import time

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def get_kinde_m2m_token():
    """Fetches an M2M access token from Kinde to use the Management API."""
    client_id = settings.KINDE_CLIENT_ID_M2M
    client_secret = settings.KINDE_CLIENT_SECRET_M2M
    audience = settings.KINDE_MGMNT_AUDIENCE
    token_url = "https://ghhs.kinde.com/oauth2/token"

    if not client_id or not client_secret:
        print("[ERROR] Kinde M2M Client ID or Secret not configured in environment variables.")
        return None

    payload = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
        'audience': audience
    }

    try:
        print(f"Requesting Kinde M2M token from {token_url} for audience {audience}...")
        response = requests.post(token_url, data=payload, timeout=15)
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get('access_token')
        if not access_token:
            print(f"[ERROR] 'access_token' not found in Kinde M2M response: {token_data}")
            return None
        print("[OK] Successfully obtained Kinde M2M access token.")
        return access_token
    except requests.exceptions.RequestException as e:
        error_details = "No details available."
        if e.response is not None:
            try:
                error_details = e.response.json()
            except ValueError:
                error_details = e.response.text
        print(f"[ERROR] Failed to get Kinde M2M token: {e}. Details: {error_details}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error getting Kinde M2M token: {e}")
        return None

def create_kinde_user(email, first_name, last_name, access_token):
    """Create a user in Kinde with email + password authentication enabled"""
    kinde_api_url = "https://ghhs.kinde.com/api/v1/user"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    data = {
        "profile": {
            "given_name": first_name,
            "family_name": last_name
        },
        "identities": [
            {
                "type": "email",
                "details": {
                    "email": email,
                    "password": None  # This will trigger a password setup email
                }
            }
        ],
        "is_password_reset_required": True  # This will require the user to set a password on first login
    }
    
    try:
        response = requests.post(kinde_api_url, headers=headers, json=data, timeout=15)
        
        # Handle various response codes
        if response.status_code in [201, 200]:  # Accept both 201 and 200 as success
            print(f"[OK] Successfully created user in Kinde: {email}")
            return response.json()
        elif response.status_code in [400, 409]:
            error_data = response.json()
            print(f"[INFO] Kinde API response for user '{email}' (Code: {response.status_code}). Details: {error_data}")
            if "already exists" in str(error_data).lower() or response.status_code == 409:
                return {"status": "exists", "email": email}
        else:
            response.raise_for_status()
            
    except requests.exceptions.RequestException as e:
        error_details = "No details available."
        if e.response is not None:
            try:
                error_details = e.response.json()
            except ValueError:
                error_details = e.response.text
        print(f"[ERROR] Failed to create user in Kinde: {e}. Details: {error_details}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error creating user in Kinde: {e}")
        return None

def create_django_user(email, first_name, last_name):
    """Create a user in Django with an unusable password (for Kinde SSO)"""
    User = get_user_model()
    try:
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=True,
            is_superuser=True
        )
        user.set_unusable_password()  # Explicitly set unusable password
        user.save()
        print(f"[OK] Successfully created user in Django with unusable password: {email}")
        return user
    except Exception as e:
        print(f"[ERROR] Failed to create user in Django: {str(e)}")
        return None

def main():
    # Get Kinde M2M token first
    print("\nAttempting to get Kinde Management API token...")
    kinde_m2m_token = get_kinde_m2m_token()
    if not kinde_m2m_token:
        print("[ABORT] Cannot proceed without Kinde M2M token.")
        sys.exit(1)

    # User details
    email = input("Enter email: ")
    first_name = input("Enter first name: ")
    last_name = input("Enter last name: ")
    
    # Create user in Kinde
    kinde_user = create_kinde_user(email, first_name, last_name, kinde_m2m_token)
    if kinde_user:
        # Create user in Django
        django_user = create_django_user(email, first_name, last_name)
        if django_user:
            print("\n[SUCCESS] User created successfully in both Kinde and Django!")
            print(f"Email: {email}")
            print(f"Name: {first_name} {last_name}")
        else:
            print("\n[ERROR] Failed to create user in Django")
    else:
        print("\n[ERROR] Failed to create user in Kinde")

if __name__ == "__main__":
    main()