from django.db import models
from properties.models import Agency, PrivateOwner, Property, Tenant
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import uuid

class IssueType(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=1000, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
class BeepingAlarm(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('requires_call_back', 'Requires Call Back'),
        ('awaiting_response', 'Awaiting Response'),
        ('to_be_scheduled', 'To Be Scheduled'),
        ('to_be_quoted', 'To Be Quoted'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    allocation = models.ManyToManyField('auth.User', related_name='alarm_issues', blank=True)
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default='new')  
    issue_type = models.ForeignKey(IssueType, on_delete=models.CASCADE)
    notes = models.TextField(max_length=1000)
    is_active = models.BooleanField(default=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    is_customer_contacted = models.BooleanField(default=False, verbose_name="Customer Contacted")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    is_cancelled = models.BooleanField(default=False)

    def clean(self):
        """
        Validate that is_completed and is_cancelled are mutually exclusive.
        Both can be False, but not both True.
        """
        super().clean()
        if self.is_completed and self.is_cancelled:
            raise ValidationError({
                'is_completed': 'An alarm cannot be both completed and cancelled.',
                'is_cancelled': 'An alarm cannot be both completed and cancelled.'
            })

    def save(self, *args, **kwargs):
        """
        Override save to call clean() validation.
        """
        self.clean()
        super().save(*args, **kwargs)

class BeepingAlarmUpdate(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    beeping_alarm = models.ForeignKey(BeepingAlarm, on_delete=models.CASCADE)
    status = models.CharField(max_length=100, choices=BeepingAlarm.STATUS_CHOICES)
    date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(max_length=1000)
    update_by = models.ForeignKey(User, on_delete=models.CASCADE)