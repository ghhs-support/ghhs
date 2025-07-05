from django.contrib import admin
from .models import Tenant, Agency, PropertyManager, PrivateOwner, Property

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'notes')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'notes')

@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'suburb', 'state')
    list_filter = ('state', 'suburb')
    search_fields = ('name', 'email', 'phone')
    filter_horizontal = ('property_managers',)

@admin.register(PropertyManager)
class PropertyManagerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'notes')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'notes')

@admin.register(PrivateOwner)
class PrivateOwnerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'notes')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'notes')

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('street_address', 'suburb', 'state', 'agency', 'private_owners_count', 'unit_number', 'street_number', 'street_name')
    list_filter = ('state', 'suburb', 'agency')
    search_fields = ('street_name', 'suburb', 'agency__name', 'private_owners__first_name', 'private_owners__last_name', 'unit_number', 'street_number', 'street_name')

    def street_address(self, obj):
        unit = f"{obj.unit_number}/" if obj.unit_number else ""
        return f"{unit}{obj.street_number} {obj.street_name}"
    street_address.short_description = 'Address'
    
    def private_owners_count(self, obj):
        return obj.private_owners.count()
    private_owners_count.short_description = 'Private Owners'

