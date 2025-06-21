from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AlarmViewSet, 
    TenantViewSet, 
    AlarmUpdateViewSet, 
    AlarmImageViewSet, 
    get_address_suggestions, 
    get_tenant_suggestions,
    UserViewSet
)

router = DefaultRouter()
router.register(r'alarms', AlarmViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'alarm-updates', AlarmUpdateViewSet)
router.register(r'alarm-images', AlarmImageViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('address-suggestions/', get_address_suggestions, name='address-suggestions'),
    path('tenant-suggestions/', get_tenant_suggestions, name='tenant-suggestions'),
] 