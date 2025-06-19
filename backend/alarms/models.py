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

    SOUND_TYPE_CHOICES = [
        ('full_alarm', 'Full Alarm'),
        ('chirping_alarm', 'Chirping Alarm'),
    ]

    BRAND_CHOICES = [
        ('red', 'Red'),
        ('firepro', 'FirePro'),
        ('emerald', 'Emerald'),
        ('cavius', 'Cavius'),
        ('other', 'Other'),
    ]

    date = models.DateField()
    is_rental = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)
    realestate_name = models.CharField(max_length=255, blank=True, null=True)
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
    sound_type = models.CharField(max_length=50, choices=SOUND_TYPE_CHOICES)
    install_date = models.DateField(null=True, blank=True)
    brand = models.CharField(max_length=100, choices=BRAND_CHOICES)
    hardwire_alarm = models.IntegerField(null=True, blank=True)
    wireless_alarm = models.IntegerField(null=True, blank=True)
    is_wall_control = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='to_be_booked')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.address} - {self.date}"

    class Meta:
        ordering = ['-date']

class Tenant(models.Model):
    alarm = models.ForeignKey(Alarm, on_delete=models.CASCADE, related_name='tenants')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.phone})"

    class Meta:
        ordering = ['created_at']
