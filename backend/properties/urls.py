from django.urls import path
from . import views

urlpatterns = [
    path('agencies/', views.agencies, name='agencies'),
    path('private-owners/', views.private_owners, name='private_owners'),
    path('properties/', views.properties, name='properties'),
    path('properties/<int:property_id>/', views.property_detail, name='property_detail'),
    path('properties/<int:property_id>/add_tenant/', views.add_tenant_to_property, name='add_tenant_to_property'),
    path('properties/<int:property_id>/remove_tenant/', views.remove_tenant_from_property, name='remove_tenant_from_property'),
    path('tenants/<int:tenant_id>/', views.update_tenant, name='update_tenant'),
    # --- Private Owner Endpoints ---
    path('properties/<int:property_id>/add_private_owner/', views.add_private_owner_to_property, name='add_private_owner_to_property'),
    path('properties/<int:property_id>/remove_private_owner/', views.remove_private_owner_from_property, name='remove_private_owner_from_property'),
    path('private_owners/<int:owner_id>/', views.update_private_owner, name='update_private_owner'),
] 