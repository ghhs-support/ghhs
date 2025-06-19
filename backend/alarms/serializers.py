from rest_framework import serializers
from .models import Alarm, Tenant

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone']

class AlarmSerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True, required=False)
    
    class Meta:
        model = Alarm
        fields = [
            'id',
            'date',
            'is_rental',
            'is_private',
            'realestate_name',
            'street_number',
            'street_name',
            'suburb',
            'city',
            'state',
            'postal_code',
            'country',
            'latitude',
            'longitude',
            'who_contacted',
            'contact_method',
            'work_order_number',
            'sound_type',
            'install_date',
            'brand',
            'hardwire_alarm',
            'wireless_alarm',
            'is_wall_control',
            'completed',
            'stage',
            'created_at',
            'updated_at',
            'tenants'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        tenants_data = validated_data.pop('tenants', [])
        alarm = Alarm.objects.create(**validated_data)
        
        for tenant_data in tenants_data:
            Tenant.objects.create(alarm=alarm, **tenant_data)
        
        return alarm 