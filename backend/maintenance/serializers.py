from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BeepingAlarm, IssueType
from properties.models import Property, Tenant
from common.serializer import UserSerializer

class IssueTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueType
        fields = ['id', 'name', 'description']

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'first_name', 'last_name', 'phone']

class PropertySerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True, read_only=True)
    class Meta:
        model = Property
        fields = ['id', 'unit_number', 'street_number', 'street_name', 'suburb', 'state', 'postcode', 'tenants']

class BeepingAlarmSerializer(serializers.ModelSerializer):
    allocation = UserSerializer(many=True, read_only=True)
    property = PropertySerializer(read_only=True)
    issue_type = IssueTypeSerializer(read_only=True)
    
    class Meta:
        model = BeepingAlarm
        fields = '__all__'

class BeepingAlarmCreateSerializer(serializers.ModelSerializer):
    allocation = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=User.objects.all(), 
        required=False
    )
    
    class Meta:
        model = BeepingAlarm
        fields = [
            'issue_type', 'notes', 'property', 'allocation', 'status',
            'is_customer_contacted'
        ]
    
    def create(self, validated_data):
        """
        Create a new BeepingAlarm instance
        """
        # Extract many-to-many fields
        allocation_data = validated_data.pop('allocation', [])
        
        # Create the BeepingAlarm instance
        beeping_alarm = BeepingAlarm.objects.create(**validated_data)
        
        # Add many-to-many relationships
        if allocation_data:
            beeping_alarm.allocation.set(allocation_data)
        
        return beeping_alarm