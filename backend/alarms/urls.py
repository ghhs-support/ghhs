from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlarmViewSet, TenantViewSet, get_address_suggestions

router = DefaultRouter()
router.register(r'alarms', AlarmViewSet)
router.register(r'tenants', TenantViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('address-suggestions/', get_address_suggestions, name='address-suggestions'),
] 