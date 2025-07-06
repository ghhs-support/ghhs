from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Agency, PrivateOwner, Property, Tenant, PropertyManager
from .serializers import AgencySerializer, PrivateOwnerSerializer, PropertySerializer, PropertyManagerSerializer
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

@api_view(['POST'])
@validate_kinde_token
def add_private_owner_to_property(request, property_id):
    """Add a private owner to a property"""
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

    # Create new private owner
    private_owner = PrivateOwner.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email
    )

    # Add private owner to property
    property_obj.private_owners.add(private_owner)
    property_obj.save()

    # Return updated property
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@validate_kinde_token
def remove_private_owner_from_property(request, property_id):
    """Remove a private owner from a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

    private_owner_id = request.data.get('private_owner_id')
    if not private_owner_id:
        return Response({'detail': 'Private owner ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        private_owner = PrivateOwner.objects.get(id=private_owner_id)
    except PrivateOwner.DoesNotExist:
        return Response({'detail': 'Private owner not found'}, status=status.HTTP_404_NOT_FOUND)

    # Remove private owner from property
    property_obj.private_owners.remove(private_owner)
    property_obj.save()

    # Optionally, delete the private owner if not attached to any other property
    if private_owner.properties.count() == 0:
        private_owner.delete()

    # Return updated property
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data)

@api_view(['PATCH'])
@validate_kinde_token
def update_private_owner(request, owner_id):
    """Update a private owner's information"""
    try:
        private_owner = PrivateOwner.objects.get(id=owner_id)
    except PrivateOwner.DoesNotExist:
        return Response({'detail': 'Private owner not found'}, status=status.HTTP_404_NOT_FOUND)

    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    phone = request.data.get('phone')
    email = request.data.get('email')
    if first_name:
        private_owner.first_name = first_name
    if last_name:
        private_owner.last_name = last_name
    if phone:
        private_owner.phone = phone
    if email is not None:
        private_owner.email = email
    private_owner.save()

    serializer = PrivateOwnerSerializer(private_owner)
    return Response(serializer.data)

@api_view(['PATCH'])
@validate_kinde_token
def update_agency(request, agency_id):
    """Update an agency's information"""
    try:
        agency = Agency.objects.get(id=agency_id)
    except Agency.DoesNotExist:
        return Response({'detail': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)

    name = request.data.get('name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    unit_number = request.data.get('unit_number')
    street_number = request.data.get('street_number')
    street_name = request.data.get('street_name')
    suburb = request.data.get('suburb')
    state = request.data.get('state')
    postcode = request.data.get('postcode')
    country = request.data.get('country')
    longitude = request.data.get('longitude')
    latitude = request.data.get('latitude')

    if name:
        agency.name = name
    if email:
        agency.email = email
    if phone:
        agency.phone = phone
    if unit_number is not None:
        agency.unit_number = unit_number
    if street_number is not None:
        agency.street_number = street_number
    if street_name is not None:
        agency.street_name = street_name
    if suburb is not None:
        agency.suburb = suburb
    if state is not None:
        agency.state = state
    if postcode is not None:
        agency.postcode = postcode
    if country is not None:
        agency.country = country
    if longitude is not None:
        agency.longitude = longitude
    if latitude is not None:
        agency.latitude = latitude
    agency.save()

    serializer = AgencySerializer(agency)
    return Response(serializer.data)

@api_view(['POST'])
@validate_kinde_token
def add_property_manager_to_agency(request, agency_id):
    """Add a property manager to an agency"""
    try:
        agency = Agency.objects.get(id=agency_id)
    except Agency.DoesNotExist:
        return Response({'detail': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)

    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    notes = request.data.get('notes')
    if not all([first_name, last_name, email, phone]):
        return Response({'detail': 'First name, last name, email, and phone are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Create new property manager
    manager = PropertyManager.objects.create(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        notes=notes
    )
    agency.property_managers.add(manager)
    agency.save()

    agency.refresh_from_db()
    serializer = AgencySerializer(agency)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@validate_kinde_token
def remove_property_manager_from_agency(request, agency_id):
    """Remove a property manager from an agency"""
    try:
        agency = Agency.objects.get(id=agency_id)
    except Agency.DoesNotExist:
        return Response({'detail': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)

    manager_id = request.data.get('manager_id')
    if not manager_id:
        return Response({'detail': 'Manager ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        manager = PropertyManager.objects.get(id=manager_id)
    except PropertyManager.DoesNotExist:
        return Response({'detail': 'Property manager not found'}, status=status.HTTP_404_NOT_FOUND)

    agency.property_managers.remove(manager)
    agency.save()

    # Optionally, delete the manager if not attached to any other agency
    if manager.agencies.count() == 0:
        manager.delete()

    agency.refresh_from_db()
    serializer = AgencySerializer(agency)
    return Response(serializer.data)

@api_view(['PATCH'])
@validate_kinde_token
def update_property_manager(request, manager_id):
    """Update a property manager's information"""
    try:
        manager = PropertyManager.objects.get(id=manager_id)
    except PropertyManager.DoesNotExist:
        return Response({'detail': 'Property manager not found'}, status=status.HTTP_404_NOT_FOUND)

    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    notes = request.data.get('notes')
    if first_name:
        manager.first_name = first_name
    if last_name:
        manager.last_name = last_name
    if email is not None:
        manager.email = email
    if phone is not None:
        manager.phone = phone
    if notes is not None:
        manager.notes = notes
    manager.save()

    serializer = PropertyManagerSerializer(manager)
    return Response(serializer.data)
