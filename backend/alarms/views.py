from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Alarm
from .serializers import AlarmSerializer

# Create your views here.

class AlarmViewSet(viewsets.ModelViewSet):
    queryset = Alarm.objects.all()
    serializer_class = AlarmSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Alarm.objects.all()
        stage = self.request.query_params.get('stage', None)
        completed = self.request.query_params.get('completed', None)
        
        if stage:
            queryset = queryset.filter(stage=stage)
        if completed is not None:
            queryset = queryset.filter(completed=completed == 'true')
            
        return queryset.order_by('-date')
