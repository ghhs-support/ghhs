from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BeepingAlarm
from properties.models import Property

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'unit_number', 'street_number', 'street_name', 'suburb', 'state', 'postcode']

class BeepingAlarmSerializer(serializers.ModelSerializer):
    allocation = UserSerializer(many=True, read_only=True)
    property = PropertySerializer(read_only=True)
    
    class Meta:
        model = BeepingAlarm
        fields = '__all__'