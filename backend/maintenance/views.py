from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import BeepingAlarm
from .serializers import BeepingAlarmSerializer
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from backend.authentication import validate_kinde_token

@api_view(['GET', 'POST'])
@validate_kinde_token
def beeping_alarms(request):
    if request.method == 'GET':
        beeping_alarms = BeepingAlarm.objects.all()
        serializer = BeepingAlarmSerializer(beeping_alarms, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BeepingAlarmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
