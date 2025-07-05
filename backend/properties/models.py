from django.db import models
from django.core.exceptions import ValidationError
import uuid

class Tenant(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=100)
    notes = models.TextField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Agency(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    phone = models.CharField(max_length=100)
    unit_number = models.CharField(max_length=100, null=True, blank=True)
    street_number = models.CharField(max_length=100, null=True, blank=True)
    street_name = models.CharField(max_length=100, null=True, blank=True)
    suburb = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    postcode = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    property_managers = models.ManyToManyField('PropertyManager', related_name='agencies', blank=True)

    def __str__(self):
        return self.name

class PropertyManager(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(max_length=100)
    phone = models.CharField(max_length=100)
    notes = models.TextField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class PrivateOwner(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=100)
    notes = models.TextField(max_length=1000, null=True, blank=True)

    def __str__(self):
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

class Property(models.Model):
    uid = models.CharField(max_length=100, unique=True, default=uuid.uuid4, editable=False)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, null=True, blank=True)
    private_owners = models.ManyToManyField(PrivateOwner, related_name='properties', blank=True)
    tenants = models.ManyToManyField(Tenant, related_name='properties', blank=True)
    unit_number = models.CharField(max_length=100, null=True, blank=True)
    street_number = models.CharField(max_length=100)
    street_name = models.CharField(max_length=100)
    suburb = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postcode = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def clean(self):
        super().clean()
        has_agency = bool(self.agency)
        # Only check private_owners if the object is saved (has pk)
        has_private_owners = self.pk and self.private_owners.exists()
        if not has_agency and not has_private_owners:
            raise ValidationError("Property must have an agency or private owners")
        if has_agency and has_private_owners:
            raise ValidationError("Property cannot have both agency and private owners")

    def save(self, *args, **kwargs):
        # Only run full_clean if not using raw save (e.g., during initial creation for M2M)
        if kwargs.pop('_skip_full_clean', False):
            super().save(*args, **kwargs)
        else:
            self.full_clean()
            super().save(*args, **kwargs)


