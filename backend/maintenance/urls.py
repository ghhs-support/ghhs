from django.urls import path
from .views import beeping_alarms

urlpatterns = [
    path('beeping_alarms/', beeping_alarms, name='beeping_alarms'),
]