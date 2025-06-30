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

@admin.register(PropertyManager)
class PropertyManagerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'agency')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'agency__name')

@admin.register(PrivateOwner)
class PrivateOwnerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'notes')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'notes')

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('street_address', 'suburb', 'state', 'agency', 'private_owner', 'unit_number', 'street_number', 'street_name')
    list_filter = ('state', 'suburb', 'agency', 'private_owner')
    search_fields = ('street_name', 'suburb', 'agency__name', 'private_owner__first_name', 'private_owner__last_name', 'unit_number', 'street_number', 'street_name')

    def street_address(self, obj):
        unit = f"{obj.unit_number}/" if obj.unit_number else ""
        return f"{unit}{obj.street_number} {obj.street_name}"
    street_address.short_description = 'Address'

