from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.get_users, name='get_users'),
    path('address/autocomplete/', views.address_autocomplete, name='address_autocomplete'),
    path('address/details/', views.get_place_details, name='get_place_details'),
]
