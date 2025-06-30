from django.db import models
from properties.models import Agency, PrivateOwner, Property
import uuid

class IssueType(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return self.name
    
class Alarmissue(models.Model):
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
    allocation = models.ManyToManyField('auth.User', related_name='alarm_issues')
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default='new')  
    issue_type = models.ForeignKey(IssueType, on_delete=models.CASCADE)
    notes = models.TextField(max_length=1000)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    private_owner = models.ForeignKey(PrivateOwner, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    is_agency = models.BooleanField(default=False)
    is_private_owner = models.BooleanField(default=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    