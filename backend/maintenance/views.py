from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BeepingAlarm, Tenant
from .serializers import BeepingAlarmSerializer
from rest_framework import status
from backend.authentication import validate_kinde_token
from common.pagination import CustomPageNumberPagination
from django.db.models import Q
from properties.models import Tenant as PropertyTenant, Property
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@validate_kinde_token
def beeping_alarms(request):
    if request.method == 'GET':
        # Initialize pagination
        paginator = CustomPageNumberPagination()
        
        # Get query parameters
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', None)
        is_customer_contacted_filter = request.query_params.get('is_customer_contacted', None)
        property_filter = request.query_params.get('property', None)
        agency_private_filter = request.query_params.get('agency_private', None)
        ordering = request.query_params.get('ordering', '-created_at')  # Default sort by created_at desc
        
        # Start with all alarms
        queryset = BeepingAlarm.objects.select_related('property', 'agency', 'private_owner', 'tenant').prefetch_related('allocation')
        
        # Apply status filter if provided
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply customer contacted filter if provided
        if is_customer_contacted_filter is not None:
            if is_customer_contacted_filter.lower() == 'true':
                queryset = queryset.filter(is_customer_contacted=True)
            elif is_customer_contacted_filter.lower() == 'false':
                queryset = queryset.filter(is_customer_contacted=False)
        
        # Apply property filter if provided
        if property_filter:
            queryset = queryset.filter(property_id=property_filter)
        
        # Apply agency/private filter if provided
        if agency_private_filter:
            if agency_private_filter.lower() == 'agency':
                queryset = queryset.filter(is_agency=True)
            elif agency_private_filter.lower() == 'private':
                queryset = queryset.filter(is_private_owner=True)
        
        # Apply search filter
        if search:
            search_terms = search.split()
            q_objects = Q()
            
            for term in search_terms:
                term_q = (
                    Q(notes__icontains=term) |
                    Q(property__street_number__icontains=term) |
                    Q(property__street_name__icontains=term) |
                    Q(property__suburb__icontains=term) |
                    Q(property__state__icontains=term) |
                    Q(property__postcode__icontains=term) |
                    Q(allocation__first_name__icontains=term) |
                    Q(allocation__last_name__icontains=term) |
                    Q(allocation__username__icontains=term)
                )
                q_objects &= term_q
            
            queryset = queryset.filter(q_objects).distinct()
        
        # Get allocation filter
        allocation_id = request.query_params.get('allocation', None)
        
        # Apply allocation filter if provided
        if allocation_id:
            queryset = queryset.filter(allocation__id=allocation_id)
        
        # Get tenant filter
        tenant_id = request.query_params.get('tenant', None)
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        
        # Apply ordering
        if ordering:
            # Handle custom ordering for specific fields
            if ordering == 'allocation':
                queryset = queryset.order_by('allocation__first_name')
            elif ordering == '-allocation':
                queryset = queryset.order_by('-allocation__first_name')
            elif ordering == 'agency_private':
                queryset = queryset.order_by('is_agency')
            elif ordering == '-agency_private':
                queryset = queryset.order_by('-is_agency')
            elif ordering == 'customer_contacted':
                queryset = queryset.order_by('is_customer_contacted')
            elif ordering == '-customer_contacted':
                queryset = queryset.order_by('-is_customer_contacted')
            elif ordering == 'property':
                queryset = queryset.order_by('property__street_name', 'property__street_number')
            elif ordering == '-property':
                queryset = queryset.order_by('-property__street_name', '-property__street_number')
            else:
                # For other fields, use the ordering directly
                queryset = queryset.order_by(ordering)
        
        # Paginate the results
        page = paginator.paginate_queryset(queryset, request)
        serializer = BeepingAlarmSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
        
    elif request.method == 'POST':
        serializer = BeepingAlarmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@validate_kinde_token
def tenant_suggestions(request):
    print(f"=== TENANT SUGGESTIONS DEBUG ===")
    print(f"Query params: {request.query_params}")
    
    search = request.query_params.get('q', '').strip()
    print(f"Search query: '{search}'")
    
    # Get tenants that are actually used in BeepingAlarms
    used_tenant_ids = BeepingAlarm.objects.values_list('tenant_id', flat=True).distinct()
    
    # If no search query, return all used tenants (limited)
    if len(search) == 0:
        print("No search query, returning all used tenants")
        tenants = PropertyTenant.objects.filter(id__in=used_tenant_ids).order_by('first_name')[:20]
        tenants = list(tenants)
        
        print(f"Returning {len(tenants)} all tenants")
        for tenant in tenants[:5]:  # Show first 5 in debug
            print(f"All tenant: ID={tenant.id}, name='{tenant.first_name} {tenant.last_name}', phone='{tenant.phone}'")
        
        results = [
            {
                'value': str(tenant.id),
                'label': f"{tenant.first_name} {tenant.last_name} - {tenant.phone}"
            }
            for tenant in tenants
        ]
        
        print(f"Returning {len(results)} results for empty search")
        print(f"=== END DEBUG ===")
        return Response(results)
    
    # If search is too short but not empty, still return empty to avoid too many results while typing
    if len(search) < 2:
        print("Search query too short (but not empty), returning empty list")
        return Response([])
    
    # For phone number search, remove spaces and common formatting characters
    search_clean_phone = ''.join(char for char in search if char.isdigit())
    print(f"Cleaned phone search: '{search_clean_phone}'")
    
    # Build the search query
    query_filter = (
        Q(first_name__icontains=search) |
        Q(last_name__icontains=search) |
        Q(phone__icontains=search)  # Original phone search with spaces
    )
    
    # If the search looks like a phone number (contains digits), add flexible phone matching
    if search_clean_phone and len(search_clean_phone) >= 3:
        print(f"Added flexible phone search for: '{search_clean_phone}'")
    
    print(f"Search filter applied")
    
    # Search in tenants that are used by BeepingAlarms
    tenants = PropertyTenant.objects.filter(id__in=used_tenant_ids).filter(query_filter)[:10]
    
    # If no results with standard search and it looks like a phone number, try manual matching
    if not tenants.exists() and search_clean_phone and len(search_clean_phone) >= 3:
        print("No results with standard search, trying custom phone matching...")
        
        # Get all used tenants and filter manually
        all_used_tenants = PropertyTenant.objects.filter(id__in=used_tenant_ids)
        matching_tenants = []
        
        for tenant in all_used_tenants:
            # Clean the tenant's phone number
            tenant_clean_phone = ''.join(char for char in (tenant.phone or '') if char.isdigit())
            
            # Check if search phone is contained in tenant phone or vice versa
            if (search_clean_phone in tenant_clean_phone or 
                tenant_clean_phone in search_clean_phone):
                matching_tenants.append(tenant)
                print(f"Manual match: tenant phone '{tenant.phone}' -> '{tenant_clean_phone}' matches search '{search_clean_phone}'")
                
                if len(matching_tenants) >= 10:  # Limit results
                    break
        
        tenants = matching_tenants
    else:
        tenants = list(tenants)
    
    print(f"Found {len(tenants)} tenants matching query")
    
    # Show matching tenants for debugging
    for tenant in tenants:
        tenant_clean_phone = ''.join(char for char in (tenant.phone or '') if char.isdigit())
        print(f"Matching tenant: ID={tenant.id}, name='{tenant.first_name} {tenant.last_name}', phone='{tenant.phone}' (clean: '{tenant_clean_phone}')")
    
    # Format results
    results = [
        {
            'value': str(tenant.id),
            'label': f"{tenant.first_name} {tenant.last_name} - {tenant.phone}"
        }
        for tenant in tenants
    ]
    
    print(f"Returning {len(results)} results: {results}")
    print(f"=== END DEBUG ===")
    return Response(results)

@api_view(['GET'])
@validate_kinde_token
def property_suggestions(request):
    search = request.query_params.get('q', '').strip()
    
    # Get properties that are actually used in BeepingAlarms
    used_property_ids = BeepingAlarm.objects.values_list('property_id', flat=True).distinct()
    
    # If no search query, return all used properties (limited)
    if len(search) == 0:
        properties = Property.objects.filter(id__in=used_property_ids).order_by('street_name', 'street_number')[:20]
        
        results = [
            {
                'value': str(prop.id),
                'label': f"{prop.unit_number + '/' if prop.unit_number else ''}{prop.street_number} {prop.street_name}, {prop.suburb} {prop.state} {prop.postcode}"
            }
            for prop in properties
        ]
        
        return Response(results)
    
    # If search is too short but not empty, return empty to avoid too many results while typing
    if len(search) < 2:
        return Response([])
    
    # Build the search query for property address components
    query_filter = (
        Q(street_number__icontains=search) |
        Q(street_name__icontains=search) |
        Q(suburb__icontains=search) |
        Q(state__icontains=search) |
        Q(postcode__icontains=search) |
        Q(unit_number__icontains=search)
    )
    
    # Search in properties that are used by BeepingAlarms
    properties = Property.objects.filter(id__in=used_property_ids).filter(query_filter).order_by('street_name', 'street_number')[:10]
    
    # Format results
    results = [
        {
            'value': str(prop.id),
            'label': f"{prop.unit_number + '/' if prop.unit_number else ''}{prop.street_number} {prop.street_name}, {prop.suburb} {prop.state} {prop.postcode}"
        }
        for prop in properties
    ]
    
    return Response(results)
