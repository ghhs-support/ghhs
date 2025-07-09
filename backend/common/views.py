from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from common.serializer import UserSerializer  
from backend.authentication import validate_kinde_token
from common.google_api import GooglePlacesAPI

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

@api_view(['GET'])
@validate_kinde_token
def address_autocomplete(request):
    api = GooglePlacesAPI()
    return Response(api.autocomplete_address(request.query_params['input'], request.query_params['country_code']))

@api_view(['GET'])
@validate_kinde_token
def get_place_details(request):
    api = GooglePlacesAPI()
    return Response(api.get_place_details(request.query_params['place_id']))
