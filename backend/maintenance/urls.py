from django.urls import path
from .views import beeping_alarms, issue_types
from . import views

urlpatterns = [
    path('beeping_alarms/', beeping_alarms, name='beeping_alarms'),
    path('issue_types/', issue_types, name='issue_types'),
    path('tenant-suggestions/', views.tenant_suggestions, name='tenant-suggestions'),
    path('property-suggestions/', views.property_suggestions, name='property_suggestions'),
]