from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Agency, PrivateOwner, Property
from .serializers import AgencySerializer, PrivateOwnerSerializer, PropertySerializer

# Create your views here.

@api_view(['GET'])
def agencies(request):
    """Get all agencies"""
    agencies = Agency.objects.all()
    serializer = AgencySerializer(agencies, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def private_owners(request):
    """Get all private owners"""
    private_owners = PrivateOwner.objects.all()
    serializer = PrivateOwnerSerializer(private_owners, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def properties(request):
    """Get all properties with their tenants, agency, and private owner"""
    properties = Property.objects.prefetch_related('tenants', 'agency', 'private_owner').all()
    serializer = PropertySerializer(properties, many=True)
    return Response(serializer.data)
