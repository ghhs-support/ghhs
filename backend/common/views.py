from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
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
    """Get address suggestions from Google Places API"""
    try:
        input_text = request.query_params.get('input', '')
        country_code = request.query_params.get('country_code', 'AU')
        
        if not input_text:
            return Response(
                {"error": "Input parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        api = GooglePlacesAPI()
        result = api.autocomplete_address(input_text, country_code)
        return Response(result)
        
    except Exception as e:
        print(f"Error in address_autocomplete: {e}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@validate_kinde_token
def get_place_details(request):
    """Get detailed place information from Google Places API"""
    try:
        place_id = request.query_params.get('place_id', '')
        
        if not place_id:
            return Response(
                {"error": "place_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        api = GooglePlacesAPI()
        result = api.get_place_details(place_id)
        return Response(result)
        
    except Exception as e:
        print(f"Error in get_place_details: {e}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
