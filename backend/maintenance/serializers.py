from rest_framework import serializers
from .models import BeepingAlarm

class BeepingAlarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeepingAlarm
        fields = '__all__'