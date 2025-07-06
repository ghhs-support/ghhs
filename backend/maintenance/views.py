from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BeepingAlarm, Tenant, IssueType
from .serializers import BeepingAlarmSerializer, BeepingAlarmCreateSerializer, IssueTypeSerializer
from rest_framework import status
from backend.authentication import validate_kinde_token
from common.pagination import CustomPageNumberPagination
from django.db.models import Q
from properties.models import Tenant as PropertyTenant, Property
from django.utils.dateparse import parse_datetime
import logging

logger = logging.getLogger(__name__)

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
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', None)
        is_customer_contacted_filter = request.query_params.get('is_customer_contacted', None)
        property_filter = request.query_params.get('property', None)
        agency_private_filter = request.query_params.get('agency_private', None)
        ordering = request.query_params.get('ordering', '-created_at')
        created_at_from = request.query_params.get('created_at_from', None)
        created_at_to = request.query_params.get('created_at_to', None)

        queryset = BeepingAlarm.objects.select_related('property').prefetch_related('allocation')

        if status_filter not in ['completed', 'cancelled']:
            queryset = queryset.filter(is_completed=False, is_cancelled=False)

        if created_at_from:
            try:
                from_datetime = parse_datetime(created_at_from)
                if from_datetime:
                    queryset = queryset.filter(created_at__gte=from_datetime)
                    logger.info(f"Applied created_at_from filter: {from_datetime}")
                else:
                    logger.warning(f"Could not parse created_at_from: {created_at_from}")
            except Exception as e:
                logger.error(f"Error parsing created_at_from '{created_at_from}': {e}")

        if created_at_to:
            try:
                to_datetime = parse_datetime(created_at_to)
                if to_datetime:
                    queryset = queryset.filter(created_at__lte=to_datetime)
                    logger.info(f"Applied created_at_to filter: {to_datetime}")
                else:
                    logger.warning(f"Could not parse created_at_to: {created_at_to}")
            except Exception as e:
                logger.error(f"Error parsing created_at_to '{created_at_to}': {e}")

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if is_customer_contacted_filter is not None:
            if is_customer_contacted_filter.lower() == 'true':
                queryset = queryset.filter(is_customer_contacted=True)
            elif is_customer_contacted_filter.lower() == 'false':
                queryset = queryset.filter(is_customer_contacted=False)

        if property_filter:
            queryset = queryset.filter(property_id=property_filter)

        if agency_private_filter:
            if agency_private_filter.lower() == 'agency':
                queryset = queryset.filter(property__is_agency=True)
            elif agency_private_filter.lower() == 'private':
                queryset = queryset.filter(property__is_private=True)

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

        allocation_id = request.query_params.get('allocation', None)
        if allocation_id:
            queryset = queryset.filter(allocation__id=allocation_id)

        tenant_id = request.query_params.get('tenant', None)
        if tenant_id:
            queryset = queryset.filter(property__tenants__id=tenant_id)

        if ordering:
            if ordering == 'allocation':
                queryset = queryset.order_by('allocation__first_name')
            elif ordering == '-allocation':
                queryset = queryset.order_by('-allocation__first_name')
            elif ordering == 'customer_contacted':
                queryset = queryset.order_by('is_customer_contacted')
            elif ordering == '-customer_contacted':
                queryset = queryset.order_by('-is_customer_contacted')
            elif ordering == 'property':
                queryset = queryset.order_by('property__street_name', 'property__street_number')
            elif ordering == '-property':
                queryset = queryset.order_by('-property__street_name', '-property__street_number')
            else:
                queryset = queryset.order_by(ordering)

        logger.info(f"Final queryset count: {queryset.count()}")
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
        tenants = PropertyTenant.objects.filter(id__in=used_tenant_ids).filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(phone__icontains=search)
        ).order_by('first_name')[:20]
        tenants = list(tenants)
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
    
    # Get properties that are actually used in active BeepingAlarms (exclude completed and cancelled)
    used_property_ids = BeepingAlarm.objects.filter(is_completed=False, is_cancelled=False).values_list('property_id', flat=True).distinct()
    
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
