from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BeepingAlarm
from .serializers import BeepingAlarmSerializer
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
import requests
import json

@api_view(['GET', 'POST'])
@csrf_exempt
def beeping_alarms(request):
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
        
        # Handle the actual request
        if request.method == 'GET':
            beeping_alarms = BeepingAlarm.objects.all()
            serializer = BeepingAlarmSerializer(beeping_alarms, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = BeepingAlarmSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except requests.RequestException:
        return Response({'error': 'Failed to validate token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({'error': 'Authentication failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
