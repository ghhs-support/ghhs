from django.urls import path
from . import views

urlpatterns = [
    path('agencies/', views.agencies, name='agencies'),
    path('private-owners/', views.private_owners, name='private_owners'),
    path('properties/', views.properties, name='properties'),
] 