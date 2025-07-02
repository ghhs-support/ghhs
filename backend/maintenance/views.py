from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BeepingAlarm
from .serializers import BeepingAlarmSerializer
from rest_framework import status
from backend.authentication import validate_kinde_token
from common.pagination import CustomPageNumberPagination
from django.db.models import Q

@api_view(['GET', 'POST'])
@validate_kinde_token
def beeping_alarms(request):
    if request.method == 'GET':
        # Initialize pagination
        paginator = CustomPageNumberPagination()
        
        # Get query parameters
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', None)
        ordering = request.query_params.get('ordering', '-created_at')  # Default sort by created_at desc
        
        # Start with all alarms
        queryset = BeepingAlarm.objects.select_related('property', 'agency', 'private_owner', 'tenant').prefetch_related('allocation')
        
        # Apply status filter if provided
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
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
