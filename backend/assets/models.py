from django.db import models
import uuid

class BatteryType(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    life_span = models.IntegerField()

    def __str__(self):
        return f"{self.name} - {self.life_span} years"

class Manufacturer(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class AlarmModel(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=1000)
    battery_type = models.ForeignKey(BatteryType, on_delete=models.CASCADE)
    is_hardwired = models.BooleanField(default=False, verbose_name="Hardwired")
    is_wireless = models.BooleanField(default=False, verbose_name="Wireless")
    is_active = models.BooleanField(default=True, verbose_name="Active")

    def clean(self):
        if self.is_hardwired and self.is_wireless:
            raise ValueError("Alarm model cannot be both hardwired and wireless")
        
        if not self.is_hardwired and not self.is_wireless:
            raise ValueError("Alarm model must be either hardwired or wireless")

        def __str__(self):
            return f"{self.manufacturer} - {self.name} - {self.battery_type} - {'Hardwired' if self.is_hardwired else 'Wireless'}"
        
        def save(self, *args, **kwargs):
            self.full_clean()
            super().save(*args, **kwargs)