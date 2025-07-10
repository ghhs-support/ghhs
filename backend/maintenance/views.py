import re
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BeepingAlarm, Tenant, IssueType
from .serializers import BeepingAlarmSerializer, BeepingAlarmCreateSerializer, IssueTypeSerializer
from .filters import BeepingAlarmFilter
from rest_framework import status
from backend.authentication import validate_kinde_token
from common.pagination import CustomPageNumberPagination
from django.db.models import Q
from properties.models import Tenant as PropertyTenant, Property
from django.utils.dateparse import parse_datetime
import logging

def normalize_phone_number(phone):
    """
    Normalize phone number by removing spaces, dashes, parentheses, and other formatting
    """
    if not phone:
        return ''
    # Remove all non-digit characters except + (for international numbers)
    return re.sub(r'[^\d+]', '', phone)

@api_view(['GET'])
@validate_kinde_token
def issue_types(request):
    """Get all issue types for creating beeping alarms"""
    issue_types = IssueType.objects.filter(is_active=True).order_by('name')
    serializer = IssueTypeSerializer(issue_types, many=True)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
@validate_kinde_token
def beeping_alarms(request):
    if request.method == 'GET':
        paginator = CustomPageNumberPagination()
        
        # Get base queryset with optimizations
        queryset = BeepingAlarm.objects.select_related('property').prefetch_related('allocation')
        
        # Apply default active filter (exclude completed/cancelled unless explicitly requested)
        status_filter = request.query_params.get('status', None)
        if status_filter not in ['completed', 'cancelled']:
            queryset = queryset.filter(is_completed=False, is_cancelled=False)
        
        # Apply Django Filter
        filterset = BeepingAlarmFilter(request.query_params, queryset=queryset)
        if not filterset.is_valid():
            return Response(filterset.errors, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = filterset.qs
        
        page = paginator.paginate_queryset(queryset, request)
        serializer = BeepingAlarmSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        serializer = BeepingAlarmCreateSerializer(data=request.data)
        if serializer.is_valid():
            beeping_alarm = serializer.save()
            response_serializer = BeepingAlarmSerializer(beeping_alarm)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@validate_kinde_token
def tenant_suggestions(request):
    search = request.query_params.get('q', '').strip()
    # Get tenants that are actually used in active BeepingAlarms (exclude completed and cancelled)
    used_tenant_ids = Property.objects.filter(beepingalarm__is_completed=False, beepingalarm__is_cancelled=False).values_list('tenants', flat=True).distinct()
    
    if len(search) == 0:
        tenants = PropertyTenant.objects.filter(id__in=used_tenant_ids).order_by('first_name')[:20]
        tenants = list(tenants)
        results = [
            {
                'value': str(tenant.id),
                'label': f"{tenant.first_name} {tenant.last_name} - {tenant.phone}"
            }
            for tenant in tenants
        ]
        return Response(results)
    else:
        # Check if search contains digits (likely a phone number)
        contains_digits = re.search(r'\d', search)
        
        if contains_digits:
            # Normalize the search for phone number comparison
            normalized_search = normalize_phone_number(search)
            
            # Get all tenants and filter by both name and normalized phone
            all_tenants = PropertyTenant.objects.filter(id__in=used_tenant_ids)
            
            matching_tenants = []
            for tenant in all_tenants:
                # Check name matches
                if (search.lower() in tenant.first_name.lower() or 
                    search.lower() in tenant.last_name.lower() or
                    search in tenant.phone):
                    matching_tenants.append(tenant)
                # Check normalized phone matches
                elif normalized_search and normalized_search in normalize_phone_number(tenant.phone):
                    matching_tenants.append(tenant)
            
            # Remove duplicates and sort
            matching_tenants = list(set(matching_tenants))
            matching_tenants.sort(key=lambda t: t.first_name)
            matching_tenants = matching_tenants[:20]
            
            results = [
                {
                    'value': str(tenant.id),
                    'label': f"{tenant.first_name} {tenant.last_name} - {tenant.phone}"
                }
                for tenant in matching_tenants
            ]
        else:
            # Text-only search (names)
            tenants = PropertyTenant.objects.filter(id__in=used_tenant_ids).filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            ).order_by('first_name')[:20]
            
            results = [
                {
                    'value': str(tenant.id),
                    'label': f"{tenant.first_name} {tenant.last_name} - {tenant.phone}"
                }
                for tenant in tenants
            ]
        
        return Response(results)

@api_view(['GET'])
@validate_kinde_token
def property_suggestions(request):
    search = request.query_params.get('q', '').strip()
    used_property_ids = BeepingAlarm.objects.filter(is_completed=False, is_cancelled=False).values_list('property_id', flat=True).distinct()
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
