from django.urls import path
from .views import (
    beeping_alarms, issue_types, beeping_alarm_detail, 
    beeping_alarm_updates, beeping_alarm_updates_create
)
from . import views

urlpatterns = [
    path('beeping_alarms/', beeping_alarms, name='beeping_alarms'),
    path('beeping_alarms/<int:alarm_id>/', beeping_alarm_detail, name='beeping_alarm_detail'),
    path('beeping_alarms/<int:alarm_id>/updates/', beeping_alarm_updates, name='beeping_alarm_updates'),
    path('beeping_alarm_updates/', beeping_alarm_updates_create, name='beeping_alarm_updates_create'),
    path('issue_types/', issue_types, name='issue_types'),
    path('tenant-suggestions/', views.tenant_suggestions, name='tenant-suggestions'),
    path('property-suggestions/', views.property_suggestions, name='property_suggestions'),
]