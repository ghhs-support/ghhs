from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth_login'),
    path('callback/', views.callback, name='auth_callback'),
    path('logout/', views.logout_view, name='auth_logout'),
]