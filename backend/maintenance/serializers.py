from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BeepingAlarm

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class BeepingAlarmSerializer(serializers.ModelSerializer):
    allocation = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = BeepingAlarm
        fields = '__all__'