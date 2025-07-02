from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from maintenance.serializers import UserSerializer  # We might want to move this to common as well
from backend.authentication import validate_kinde_token

# Create your views here.

@api_view(['GET'])
@validate_kinde_token
def get_users(request):
    """
    Get active users that can be allocated to tasks/items.
    Can be used across different parts of the application.
    """
    users = User.objects.filter(is_active=True).order_by('first_name')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
