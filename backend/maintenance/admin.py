from django.contrib import admin
from .models import IssueType, Alarmissue

@admin.register(IssueType)
class IssueTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
