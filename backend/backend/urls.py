from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from auth_app.views import callback

def admin_login_redirect(request):
    return redirect('/api/auth/login/')  # Updated to use the correct login endpoint

urlpatterns = [
    path('admin/login/', admin_login_redirect),  # Override admin login
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_app.urls')),
    path('', callback, name='root_callback'),  # Handle root callback
]
