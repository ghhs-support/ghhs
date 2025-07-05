from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BeepingAlarm, IssueType
from properties.models import Property, Tenant
from common.serializer import UserSerializer

class IssueTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueType
        fields = ['id', 'name', 'description']

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
    tenant = TenantSerializer(many=True, read_only=True)
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
    tenant = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Tenant.objects.all(), 
        required=False
    )
    
    class Meta:
        model = BeepingAlarm
        fields = [
            'issue_type', 'notes', 'agency', 'private_owner', 
            'property', 'tenant', 'allocation', 'status',
            'is_customer_contacted', 'is_agency', 'is_private_owner'
        ]
    
    def validate(self, data):
        """
        Validate that either agency or private_owner is provided, but not both
        """
        agency = data.get('agency')
        private_owner = data.get('private_owner')
        
        if not agency and not private_owner:
            raise serializers.ValidationError(
                "Either agency or private_owner must be provided"
            )
        
        if agency and private_owner:
            raise serializers.ValidationError(
                "Cannot provide both agency and private_owner"
            )
        
        # Set is_agency and is_private_owner based on what's provided
        if agency:
            data['is_agency'] = True
            data['is_private_owner'] = False
        else:
            data['is_agency'] = False
            data['is_private_owner'] = True
        
        return data
    
    def create(self, validated_data):
        """
        Create a new BeepingAlarm instance
        """
        # Extract many-to-many fields
        allocation_data = validated_data.pop('allocation', [])
        tenant_data = validated_data.pop('tenant', [])
        
        # Create the BeepingAlarm instance
        beeping_alarm = BeepingAlarm.objects.create(**validated_data)
        
        # Add many-to-many relationships
        if allocation_data:
            beeping_alarm.allocation.set(allocation_data)
        if tenant_data:
            beeping_alarm.tenant.set(tenant_data)
        
        return beeping_alarm