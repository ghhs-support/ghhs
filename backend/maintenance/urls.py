from django.urls import path
from .views import beeping_alarms
from . import views

urlpatterns = [
    path('beeping_alarms/', beeping_alarms, name='beeping_alarms'),
    path('tenant-suggestions/', views.tenant_suggestions, name='tenant-suggestions'),
]