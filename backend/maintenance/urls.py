from django.urls import path
from .views import alarm_issue

urlpatterns = [
    path('alarm_issues/', alarm_issue, name='alarm_issues'),
]