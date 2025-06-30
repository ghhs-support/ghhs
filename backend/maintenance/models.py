from django.db import models


class IssueType(models.Model):
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

    uid = models.CharField(max_length=100, unique=True)
    allocation = models.ManyToManyField('auth.User', related_name='alarm_issues')
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default='new')  
    issue_type = models.ForeignKey(IssueType, on_delete=models.CASCADE)
    notes = models.TextField(max_length=1000)
    