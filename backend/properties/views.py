from django.shortcuts import render
from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Agency, PrivateOwner, Property, Tenant, PropertyManager
from .serializers import AgencySerializer, PrivateOwnerSerializer, PropertySerializer, PropertyManagerSerializer
from .filters import PropertyFilter
from backend.authentication import validate_kinde_token
from common.pagination import CustomPageNumberPagination
from django_filters import FilterSet
from django.forms import forms

# ==============================================================================
# BASIC LIST AND DETAIL VIEWS
# ==============================================================================

@api_view(['GET'])
@validate_kinde_token
def agencies(request):
    """Get all agencies"""
    agencies = Agency.objects.all()
    serializer = AgencySerializer(agencies, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@validate_kinde_token
def private_owners(request):
    """Get all private owners"""
    private_owners = PrivateOwner.objects.all()
    serializer = PrivateOwnerSerializer(private_owners, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@validate_kinde_token
def suburbs(request):
    """Get distinct suburbs from properties"""
    suburbs = Property.objects.values_list('suburb', flat=True).distinct().order_by('suburb')
    suburbs_list = [{'value': suburb, 'label': suburb} for suburb in suburbs if suburb]
    return Response(suburbs_list)

@api_view(['GET'])
@validate_kinde_token
def postcodes(request):
    """Get distinct postcodes from properties"""
    postcodes = Property.objects.values_list('postcode', flat=True).distinct().order_by('postcode')
    postcodes_list = [{'value': postcode, 'label': postcode} for postcode in postcodes if postcode]
    return Response(postcodes_list)

@api_view(['GET'])
@validate_kinde_token
def addresses(request):
    """Get formatted addresses from properties"""
    query = request.GET.get('q', '')
    properties = Property.objects.all().order_by('street_name', 'street_number')
    addresses_list = []
    
    for property in properties:
        # Format address similar to formatPropertyAddress in frontend
        address_parts = []
        if property.unit_number:
            address_parts.append(f"Unit {property.unit_number}")
        if property.street_number:
            address_parts.append(str(property.street_number))
        if property.street_name:
            address_parts.append(property.street_name)
        if property.suburb:
            address_parts.append(property.suburb)
        if property.state:
            address_parts.append(property.state)
        if property.postcode:
            address_parts.append(property.postcode)
        
        full_address = ', '.join(address_parts)
        if full_address:
            # Filter by query if provided
            if not query or query.lower() in full_address.lower():
                addresses_list.append({
                    'value': full_address,
                    'label': full_address
                })
    
    # Remove duplicates while preserving order
    seen = set()
    unique_addresses = []
    for addr in addresses_list:
        if addr['value'] not in seen:
            seen.add(addr['value'])
            unique_addresses.append(addr)
    
    return Response(unique_addresses)

@api_view(['GET'])
@validate_kinde_token
def properties(request):
    """Get paginated properties with their tenants, agency, and private owner"""
    queryset = Property.objects.prefetch_related('tenants', 'agency', 'private_owners').all()
    
    filterset = PropertyFilter(request.query_params, queryset=queryset)
    if not filterset.is_valid():
        return Response(filterset.errors, status=status.HTTP_400_BAD_REQUEST)
    
    queryset = filterset.qs
    
    # Handle legacy ordering mapping for backward compatibility
    ordering = request.query_params.get('ordering', 'street_name')
    legacy_ordering_map = {
        'address': 'street_name',
        'owner': 'agency__name',
    }
    
    if ordering in legacy_ordering_map:
        ordering = legacy_ordering_map[ordering]
    elif ordering.startswith('-') and ordering[1:] in legacy_ordering_map:
        ordering = f'-{legacy_ordering_map[ordering[1:]]}'
    
    queryset = queryset.order_by(ordering)
    
    paginator = CustomPageNumberPagination()
    paginated_queryset = paginator.paginate_queryset(queryset, request)
    serializer = PropertySerializer(paginated_queryset, many=True)
    
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@validate_kinde_token
def property_detail(request, property_id):
    """Get a specific property with its tenants, agency, and private owner"""
    try:
        property_obj = Property.objects.prefetch_related('tenants', 'agency', 'private_owners').get(id=property_id)
        serializer = PropertySerializer(property_obj)
        return Response(serializer.data)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

# ==============================================================================
# TENANT MANAGEMENT
# ==============================================================================

@api_view(['POST'])
@validate_kinde_token
def add_tenant_to_property(request, property_id):
    """Add a tenant to a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    data = request.data.get('data', request.data)
    
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    email = data.get('email', '')
    
    if not first_name or not last_name or not phone:
        errors = {}
        if not first_name:
            errors['first_name'] = 'First name is required'
        if not last_name:
            errors['last_name'] = 'Last name is required'
        if not phone:
            errors['phone'] = 'Phone number is required'
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    
    tenant = Tenant.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email
    )
    
    property_obj.tenants.add(tenant)
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@validate_kinde_token
def remove_tenant_from_property(request, property_id, tenant_id):
    """Remove a tenant from a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        tenant = Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return Response({'detail': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    property_obj.tenants.remove(tenant)
    
    # Delete tenant if not attached to any other property
    if tenant.properties.count() == 0:
        tenant.delete()
    
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
    
    data = request.data.get('data', request.data)
    
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    email = data.get('email')
    
    if not first_name or not last_name or not phone:
        errors = {}
        if not first_name:
            errors['first_name'] = 'First name is required'
        if not last_name:
            errors['last_name'] = 'Last name is required'
        if not phone:
            errors['phone'] = 'Phone number is required'
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    
    tenant.first_name = first_name
    tenant.last_name = last_name
    tenant.phone = phone
    tenant.email = email
    tenant.save()
    
    from .serializers import TenantSerializer
    serializer = TenantSerializer(tenant)
    return Response(serializer.data)

@api_view(['PATCH'])
@validate_kinde_token
def update_tenant_in_property(request, property_id, tenant_id):
    """Update a tenant's information within a property context"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        tenant = Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return Response({'detail': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not property_obj.tenants.filter(id=tenant_id).exists():
        return Response({'detail': 'Tenant does not belong to this property'}, status=status.HTTP_400_BAD_REQUEST)
    
    data = request.data.get('data', request.data)
    
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    email = data.get('email')
    
    if not first_name or not last_name or not phone:
        errors = {}
        if not first_name:
            errors['first_name'] = 'First name is required'
        if not last_name:
            errors['last_name'] = 'Last name is required'
        if not phone:
            errors['phone'] = 'Phone number is required'
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    
    tenant.first_name = first_name
    tenant.last_name = last_name
    tenant.phone = phone
    tenant.email = email
    tenant.save()
    
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data)

# ==============================================================================
# PRIVATE OWNER MANAGEMENT
# ==============================================================================

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

    private_owner = PrivateOwner.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        email=email
    )

    property_obj.private_owners.add(private_owner)
    property_obj.save()

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

    property_obj.private_owners.remove(private_owner)
    property_obj.save()

    # Delete private owner if not attached to any other property
    if private_owner.properties.count() == 0:
        private_owner.delete()

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

# ==============================================================================
# AGENCY MANAGEMENT
# ==============================================================================

@api_view(['POST'])
@validate_kinde_token
def change_property_agency(request, property_id):
    """Change the agency of a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

    agency_id = request.data.get('agency_id')
    
    if agency_id is None:
        property_obj.agency = None
        property_obj.save()
    else:
        try:
            agency = Agency.objects.get(id=agency_id)
            property_obj.agency = agency
            property_obj.save()
        except Agency.DoesNotExist:
            return Response({'detail': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)

    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
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
    if longitude is not None and longitude != '':
        try:
            agency.longitude = float(longitude)
        except (ValueError, TypeError):
            return Response({'detail': 'Invalid longitude value'}, status=status.HTTP_400_BAD_REQUEST)
    elif longitude == '':
        agency.longitude = None
    if latitude is not None and latitude != '':
        try:
            agency.latitude = float(latitude)
        except (ValueError, TypeError):
            return Response({'detail': 'Invalid latitude value'}, status=status.HTTP_400_BAD_REQUEST)
    elif latitude == '':
        agency.latitude = None
    agency.save()

    serializer = AgencySerializer(agency)
    return Response(serializer.data)

# ==============================================================================
# PROPERTY MANAGER MANAGEMENT
# ==============================================================================

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

# ==============================================================================
# PROPERTY CRUD OPERATIONS
# ==============================================================================

@api_view(['POST'])
@validate_kinde_token
def create_property(request):
    """Create a new property"""
    data = request.data.get('data', request.data)
    
    unit_number = data.get('unit_number')
    street_number = data.get('street_number')
    street_name = data.get('street_name')
    suburb = data.get('suburb')
    state = data.get('state')
    postcode = data.get('postcode')
    agency_id = data.get('agency_id')
    private_owner_ids = data.get('private_owner_ids', [])
    force_create = data.get('force_create', False)
    
    if not all([street_number, street_name, suburb, state, postcode]):
        return Response({
            'detail': 'Street number, street name, suburb, state, and postcode are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if agency_id and private_owner_ids:
        return Response({
            'detail': 'Property cannot have both an agency and private owners'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not agency_id and not private_owner_ids:
        return Response({
            'detail': 'Property must have either an agency or private owners'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not force_create:
        duplicate_query = Property.objects.filter(
            unit_number__iexact=unit_number if unit_number else None,
            street_number__iexact=street_number,
            street_name__iexact=street_name,
            suburb__iexact=suburb,
            state__iexact=state,
            postcode__iexact=postcode
        )
        
        if not unit_number:
            duplicate_query = duplicate_query.filter(unit_number__isnull=True)
        
        if duplicate_query.exists():
            duplicate_property = duplicate_query.first()
            serializer = PropertySerializer(duplicate_property)
            return Response({
                'duplicate': True,
                'existing_property': serializer.data,
                'message': 'A property with this address already exists. Do you want to create it anyway?'
            }, status=status.HTTP_409_CONFLICT)
    
    # Create property
    property_data = {
        'unit_number': unit_number if unit_number else None,
        'street_number': street_number,
        'street_name': street_name,
        'suburb': suburb,
        'state': state,
        'postcode': postcode,
    }
    
    # Set agency if provided
    if agency_id:
        try:
            agency = Agency.objects.get(id=agency_id)
            property_data['agency'] = agency
        except Agency.DoesNotExist:
            return Response({'detail': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    property_obj = Property.objects.create(**property_data)
    
    # Add private owners if provided
    if private_owner_ids:
        for owner_id in private_owner_ids:
            try:
                private_owner = PrivateOwner.objects.get(id=owner_id)
                property_obj.private_owners.add(private_owner)
            except PrivateOwner.DoesNotExist:
                return Response({'detail': f'Private owner with ID {owner_id} not found'}, status=status.HTTP_404_NOT_FOUND)
    
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@validate_kinde_token
def update_property(request, property_id):
    """Update a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Handle is_active field directly
    if 'is_active' in request.data:
        is_active = request.data.get('is_active')
        property_obj.is_active = is_active
        property_obj.save()
        
        property_obj.refresh_from_db()
        serializer = PropertySerializer(property_obj)
        return Response(serializer.data)
    
    # Handle full property updates
    data = request.data.get('data', request.data)
    
    unit_number = data.get('unit_number')
    street_number = data.get('street_number')
    street_name = data.get('street_name')
    suburb = data.get('suburb')
    state = data.get('state')
    postcode = data.get('postcode')
    country = data.get('country')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    agency_id = data.get('agency_id')
    private_owner_id = data.get('private_owner_id')
    private_owner_ids = data.get('private_owner_ids', [])
    tenants_data = data.get('tenants', [])
    
    if not street_number or not street_name or not suburb or not state or not postcode:
        errors = {}
        if not street_number:
            errors['street_number'] = 'Street number is required'
        if not street_name:
            errors['street_name'] = 'Street name is required'
        if not suburb:
            errors['suburb'] = 'Suburb is required'
        if not state:
            errors['state'] = 'State is required'
        if not postcode:
            errors['postcode'] = 'Postcode is required'
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Update address fields
    property_obj.unit_number = unit_number if unit_number else None
    property_obj.street_number = street_number
    property_obj.street_name = street_name
    property_obj.suburb = suburb
    property_obj.state = state
    property_obj.postcode = postcode
    property_obj.country = country if country else ''
    
    # Handle latitude and longitude - convert empty strings to None
    if latitude and latitude.strip():
        try:
            property_obj.latitude = float(latitude)
        except (ValueError, TypeError):
            property_obj.latitude = None
    else:
        property_obj.latitude = None
        
    if longitude and longitude.strip():
        try:
            property_obj.longitude = float(longitude)
        except (ValueError, TypeError):
            property_obj.longitude = None
    else:
        property_obj.longitude = None
    
    # Handle agency vs private owner changes - they are mutually exclusive
    property_obj.agency = None
    property_obj.private_owners.clear()
    
    # Set agency if provided
    if agency_id is not None and agency_id:
        try:
            agency = Agency.objects.get(id=agency_id)
            property_obj.agency = agency
        except Agency.DoesNotExist:
            return Response({'detail': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Handle private owner changes - supports multiple private owners
    if private_owner_ids is not None:
        for owner_id in private_owner_ids:
            try:
                private_owner = PrivateOwner.objects.get(id=owner_id)
                property_obj.private_owners.add(private_owner)
            except PrivateOwner.DoesNotExist:
                return Response({'detail': f'Private owner with ID {owner_id} not found'}, status=status.HTTP_404_NOT_FOUND)
    elif private_owner_id is not None:
        if private_owner_id:
            try:
                private_owner = PrivateOwner.objects.get(id=private_owner_id)
                property_obj.private_owners.add(private_owner)
            except PrivateOwner.DoesNotExist:
                return Response({'detail': 'Private owner not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Handle tenant updates
    if tenants_data is not None:
        property_obj.tenants.clear()
        for tenant_data in tenants_data:
            if tenant_data.get('id') and tenant_data['id'] > 1000000:
                tenant = Tenant.objects.create(
                    first_name=tenant_data['first_name'],
                    last_name=tenant_data['last_name'],
                    phone=tenant_data['phone'],
                    email=tenant_data.get('email', '')
                )
                property_obj.tenants.add(tenant)
            else:
                try:
                    tenant = Tenant.objects.get(id=tenant_data['id'])
                    tenant.first_name = tenant_data['first_name']
                    tenant.last_name = tenant_data['last_name']
                    tenant.phone = tenant_data['phone']
                    tenant.email = tenant_data.get('email', '')
                    tenant.save()
                    property_obj.tenants.add(tenant)
                except Tenant.DoesNotExist:
                    return Response({'detail': f'Tenant with ID {tenant_data["id"]} not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        property_obj.save()
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate property ownership constraints
    has_agency = bool(property_obj.agency)
    has_private_owners = property_obj.private_owners.count() > 0
    
    if has_agency and has_private_owners:
        return Response({'detail': 'Property cannot have both an agency and private owners. It must be either agency-managed or privately owned.'}, status=status.HTTP_400_BAD_REQUEST)
    if not has_agency and not has_private_owners:
        return Response({'detail': 'Property must have either an agency or private owners'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update boolean fields based on final state
    property_obj.is_agency = has_agency
    property_obj.is_private = has_private_owners
    property_obj.save(update_fields=['is_agency', 'is_private'])
    
    property_obj.refresh_from_db()
    serializer = PropertySerializer(property_obj)
    return Response(serializer.data)

@api_view(['DELETE'])
@validate_kinde_token
def delete_property(request, property_id):
    """Delete a property"""
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    property_obj.delete()
    return Response({'detail': 'Property deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
