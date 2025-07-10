from rest_framework import serializers
from .models import Agency, PrivateOwner, Property, Tenant, PropertyManager

class PropertyManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyManager
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'notes']

class AgencySerializer(serializers.ModelSerializer):
    property_managers = PropertyManagerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Agency
        fields = ['id', 'name', 'email', 'phone', 'property_managers']

class PrivateOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateOwner
        fields = ['id', 'first_name', 'last_name', 'email', 'phone']

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'first_name', 'last_name', 'phone', 'email']

class PropertySerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True, read_only=True)
    agency = AgencySerializer(read_only=True)
    private_owners = PrivateOwnerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Property
        fields = ['id', 'unit_number', 'street_number', 'street_name', 'suburb', 'state', 'postcode', 'country', 'latitude', 'longitude', 'tenants', 'agency', 'private_owners', 'is_agency', 'is_private', 'is_active'] 