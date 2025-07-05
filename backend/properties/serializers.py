from rest_framework import serializers
from .models import Agency, PrivateOwner, Property, Tenant

class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ['id', 'name', 'email', 'phone']

class PrivateOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateOwner
        fields = ['id', 'first_name', 'last_name', 'email', 'phone']

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'first_name', 'last_name', 'phone']

class PropertySerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True, read_only=True)
    agency = AgencySerializer(read_only=True)
    private_owner = PrivateOwnerSerializer(read_only=True)
    
    class Meta:
        model = Property
        fields = ['id', 'unit_number', 'street_number', 'street_name', 'suburb', 'state', 'postcode', 'tenants', 'agency', 'private_owner'] 