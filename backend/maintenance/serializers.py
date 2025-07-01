from rest_framework import serializers
from .models import AlarmIssue

class AlarmIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlarmIssue
        fields = '__all__'