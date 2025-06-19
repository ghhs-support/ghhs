from django.db import models

# Create your models here.

class Alarm(models.Model):
    CONTACT_METHODS = [
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('work_order', 'Work Order'),
    ]
    
    STAGE_CHOICES = [
        ('to_be_booked', 'To Be Booked'),
        ('quote_sent', 'Quote Sent'),
        ('completed', 'Completed'),
        ('to_be_called', 'To Be Called'),
    ]

    date = models.DateField()
    street_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Street Number")
    street_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Street Name")
    suburb = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="Postal/Zip Code")
    country = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    who_contacted = models.CharField(max_length=255)
    contact_method = models.CharField(max_length=10, choices=CONTACT_METHODS)
    work_order_number = models.CharField(max_length=255, blank=True)
    sound_type = models.CharField(max_length=50)
    install_date = models.DateField(null=True, blank=True)
    brand = models.CharField(max_length=100)
    hardware = models.IntegerField(null=True, blank=True)
    wireless = models.IntegerField(null=True, blank=True)
    tenant_names = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    completed = models.BooleanField(default=False)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='to_be_booked')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.address} - {self.date}"

    class Meta:
        ordering = ['-date']
