from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Alarm, Tenant
from .serializers import AlarmSerializer
from rest_framework.response import Response
from rest_framework import status

# Create your views here.

class AlarmViewSet(viewsets.ModelViewSet):
    queryset = Alarm.objects.all()
    serializer_class = AlarmSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        print("\nDEBUG: get_queryset called")
        print("DEBUG: User:", self.request.user)
        print("DEBUG: User authenticated:", self.request.user.is_authenticated)
        
        queryset = Alarm.objects.all()
        stage = self.request.query_params.get('stage', None)
        completed = self.request.query_params.get('completed', None)
        
        if stage:
            queryset = queryset.filter(stage=stage)
        if completed is not None:
            queryset = queryset.filter(completed=completed == 'true')
            
        return queryset.order_by('-date')

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
