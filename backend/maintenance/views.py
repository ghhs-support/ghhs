from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BeepingAlarm
from .serializers import BeepingAlarmSerializer
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from backend.authentication import validate_kinde_token
from common.pagination import CustomPageNumberPagination
from common.filters import apply_search_filter

@api_view(['GET', 'POST'])
@validate_kinde_token
def beeping_alarms(request):
    if request.method == 'GET':
        # Initialize pagination
        paginator = CustomPageNumberPagination()
        
        # Get query parameters
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', None)
        
        # Start with all alarms
        queryset = BeepingAlarm.objects.all().order_by('-created_at')
        
        # Apply status filter if provided
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply search using common filter
        search_fields = [
            'notes',
            'property__street_number',
            'property__street_name',
            'property__suburb',
            'property__state',
            'property__postcode',
            'allocation__first_name',
            'allocation__last_name'
        ]
        queryset = apply_search_filter(queryset, search, search_fields)
        
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
