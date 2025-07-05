from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Agency, PrivateOwner, Property, Tenant
from .serializers import AgencySerializer, PrivateOwnerSerializer, PropertySerializer
from backend.authentication import validate_kinde_token

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
    properties = Property.objects.prefetch_related('tenants', 'agency', 'private_owners').all()
    serializer = PropertySerializer(properties, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def property_detail(request, property_id):
    """Get a specific property with its tenants, agency, and private owner"""
    try:
        property_obj = Property.objects.prefetch_related('tenants', 'agency', 'private_owners').get(id=property_id)
        serializer = PropertySerializer(property_obj)
        return Response(serializer.data)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@validate_kinde_token
def add_tenant_to_property(request, property_id):
    """Add a tenant to a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    phone = request.data.get('phone')
    email = request.data.get('email')
    if not all([first_name, last_name, phone]):
        return Response({'detail': 'First name, last name, and phone are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create new tenant
    tenant = Tenant.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email
    )
    
    # Add tenant to property
    property_obj.tenants.add(tenant)
    
    # Return updated property
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@validate_kinde_token
def remove_tenant_from_property(request, property_id):
    """Remove a tenant from a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    tenant_id = request.data.get('tenant_id')
    if not tenant_id:
        return Response({'detail': 'Tenant ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        tenant = Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return Response({'detail': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Remove tenant from property
    property_obj.tenants.remove(tenant)
    
    # Return updated property
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data)

@api_view(['PATCH'])
@validate_kinde_token
def update_tenant(request, tenant_id):
    """Update a tenant's information"""
    try:
        tenant = Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return Response({'detail': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    phone = request.data.get('phone')
    email = request.data.get('email')
    if first_name:
        tenant.first_name = first_name
    if last_name:
        tenant.last_name = last_name
    if phone:
        tenant.phone = phone
    if email is not None:
        tenant.email = email
    tenant.save()
    
    # Return the updated tenant
    from .serializers import TenantSerializer
    serializer = TenantSerializer(tenant)
    return Response(serializer.data)
