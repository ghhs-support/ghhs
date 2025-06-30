from django.db import models

class Agency(models.Model):
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    phone = models.CharField(max_length=100)
    unit_number = models.CharField(max_length=100)
    street_number = models.CharField(max_length=100)
    street_name = models.CharField(max_length=100)
    suburb = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postcode = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class PropertyManager(models.Model):
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    phone = models.CharField(max_length=100)
    notes = models.TextField(max_length=1000)

    
class PrivateOwner(models.Model):
    uid = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    phone = models.CharField(max_length=100)
    notes = models.TextField(max_length=1000)

class Property(models.Model):
    uid = models.CharField(max_length=100, unique=True)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    private_owner = models.ForeignKey(PrivateOwner, on_delete=models.CASCADE)
    unit_number = models.CharField(max_length=100)
    street_number = models.CharField(max_length=100)
    street_name = models.CharField(max_length=100)
    suburb = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postcode = models.CharField(max_length=100)
    country = models.CharField(max_length=100)


