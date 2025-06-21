from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Alarm, Tenant
from .serializers import AlarmSerializer, TenantSerializer
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 200
    page_query_param = 'page'

    def get_page_size(self, request):
        if self.page_size_query_param:
            page_size = request.query_params.get(self.page_size_query_param)
            if page_size:
                try:
                    page_size_int = int(page_size)
                    if page_size_int in [10, 25, 50, 100, 200]:
                        return page_size_int
                except (TypeError, ValueError):
                    pass
        return self.page_size

# Create your views here.

class AlarmViewSet(viewsets.ModelViewSet):
    queryset = Alarm.objects.all().prefetch_related('tenants').order_by('-created_at')
    serializer_class = AlarmSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    
    def get_queryset(self):
        print("\nDEBUG: get_queryset called")
        print("DEBUG: User:", self.request.user)
        print("DEBUG: User authenticated:", self.request.user.is_authenticated)
        
        queryset = super().get_queryset()
        
        # Get query parameters
        stage = self.request.query_params.get('stage', None)
        completed = self.request.query_params.get('completed', None)
        search = self.request.query_params.get('search', '').strip()
        
        # Apply filters
        if stage:
            queryset = queryset.filter(stage=stage)
        if completed is not None:
            queryset = queryset.filter(completed=completed == 'true')
        if search:
            search_terms = search.split()
            q_objects = Q()
            
            for term in search_terms:
                q_objects |= (
                    Q(realestate_name__icontains=term) |
                    Q(street_number__icontains=term) |
                    Q(street_name__icontains=term) |
                    Q(suburb__icontains=term) |
                    Q(city__icontains=term) |
                    Q(state__icontains=term) |
                    Q(postal_code__icontains=term) |
                    Q(who_contacted__icontains=term) |
                    Q(work_order_number__icontains=term) |
                    Q(tenants__name__icontains=term) |
                    Q(tenants__phone__icontains=term)
                )
            
            # Apply search filter and ensure we still have prefetch_related
            queryset = queryset.filter(q_objects).distinct().prefetch_related('tenants')
            
        return queryset.order_by('-date')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        print("\nDEBUG: Create method called")
        print("DEBUG: Request user:", request.user)
        print("DEBUG: Request user authenticated:", request.user.is_authenticated)
        print("DEBUG: Request user session:", dict(request.session))
        print("DEBUG: Request data:", request.data)
        print("DEBUG: Request headers:", request.headers)
        print("DEBUG: Request method:", request.method)
        print("DEBUG: Request auth:", request.auth)
        
        if not request.user.is_authenticated:
            print("DEBUG: User is not authenticated!")
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            response = super().create(request, *args, **kwargs)
            print("DEBUG: Create successful")
            return response
        except Exception as e:
            print("DEBUG: Create failed with error:", str(e))
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        print("\nDEBUG: perform_create called")
        print("DEBUG: Current user:", self.request.user)
        try:
            serializer.save()
            print("DEBUG: Serializer save successful")
        except Exception as e:
            print("DEBUG: Serializer save failed with error:", str(e))
            print("DEBUG: Serializer errors:", serializer.errors)
            raise

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all().select_related('alarm')
    serializer_class = TenantSerializer
