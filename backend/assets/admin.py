from django.contrib import admin
from .models import BatteryType, Manufacturer, AlarmModel

@admin.register(BatteryType)
class BatteryTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'life_span')

@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')

@admin.register(AlarmModel)
class AlarmModelAdmin(admin.ModelAdmin):
    list_display = ('manufacturer', 'name', 'battery_type', 'is_hardwired', 'is_wireless', 'is_active')
    list_filter = ('manufacturer', 'battery_type', 'is_hardwired', 'is_wireless', 'is_active')
    search_fields = ('name', 'description', 'manufacturer__name')

