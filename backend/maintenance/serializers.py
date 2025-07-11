from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BeepingAlarm, IssueType
from properties.models import Property, Tenant
from common.serializer import UserSerializer
from properties.serializers import PropertySerializer

class IssueTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueType
        fields = ['id', 'name', 'description']

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'first_name', 'last_name', 'phone']

class BeepingAlarmSerializer(serializers.ModelSerializer):
    allocation = UserSerializer(many=True, read_only=True)
    property = PropertySerializer(read_only=True)
    issue_type = IssueTypeSerializer(read_only=True)
    
    class Meta:
        model = BeepingAlarm
        fields = [
            'id', 'uid', 'allocation', 'property', 'issue_type', 'status', 'notes',
            'is_customer_contacted', 'created_at', 'updated_at'
        ]

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