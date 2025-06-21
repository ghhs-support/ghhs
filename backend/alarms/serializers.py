from rest_framework import serializers
from .models import Alarm, Tenant, AlarmUpdate, AlarmImage
from django.contrib.auth import get_user_model

User = get_user_model()

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone']

class AlarmImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AlarmImage
        fields = ['id', 'image', 'image_url', 'uploaded_at', 'description', 'uploaded_by']
        read_only_fields = ['uploaded_by', 'image_url']
    
    def get_image_url(self, obj):
        if obj.image:
            # Return direct URL since bucket is public
            return obj.image.url
        return None

class AlarmSerializer(serializers.ModelSerializer):
    tenants = TenantSerializer(many=True, required=False)
    images = AlarmImageSerializer(many=True, read_only=True)

    class Meta:
        model = Alarm
        fields = [
            'id', 'date', 'is_rental', 'is_private', 'realestate_name',
            'street_number', 'street_name', 'suburb', 'city', 'state',
            'postal_code', 'country', 'latitude', 'longitude',
            'who_contacted', 'contact_method', 'work_order_number',
            'sound_type', 'install_date', 'brand', 'hardwire_alarm',
            'wireless_alarm', 'is_wall_control', 'completed', 'stage',
            'tenants', 'created_at', 'updated_at', 'images', 'notes'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        tenants_data = validated_data.pop('tenants', [])
        alarm = Alarm.objects.create(**validated_data)
        
        for tenant_data in tenants_data:
            Tenant.objects.create(alarm=alarm, **tenant_data)
            
        return alarm

    def update(self, instance, validated_data):
        tenants_data = validated_data.pop('tenants', [])
        
        # Update alarm fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle tenants
        instance.tenants.all().delete()  # Remove existing tenants
        for tenant_data in tenants_data:
            Tenant.objects.create(alarm=instance, **tenant_data)
            
        return instance

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']

class AlarmUpdateSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AlarmUpdate
        fields = ['id', 'alarm', 'update_type', 'note', 'created_by', 'created_at']
        read_only_fields = ['created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data) 