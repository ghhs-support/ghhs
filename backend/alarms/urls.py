from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlarmViewSet, TenantViewSet, AlarmUpdateViewSet, get_address_suggestions, get_tenant_suggestions

router = DefaultRouter()
router.register(r'alarms', AlarmViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'alarm-updates', AlarmUpdateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('address-suggestions/', get_address_suggestions, name='address-suggestions'),
    path('tenant-suggestions/', get_tenant_suggestions, name='tenant-suggestions'),
] 