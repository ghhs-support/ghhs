from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BeepingAlarm
from properties.models import Property, Tenant
from common.serializer import UserSerializer

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'unit_number', 'street_number', 'street_name', 'suburb', 'state', 'postcode']

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'first_name', 'last_name', 'phone']

class BeepingAlarmSerializer(serializers.ModelSerializer):
    allocation = UserSerializer(many=True, read_only=True)
    property = PropertySerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = BeepingAlarm
        fields = '__all__'