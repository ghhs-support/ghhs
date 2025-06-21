from django.db import models
from django.contrib.auth import get_user_model
import os
from django.utils.text import slugify
from django.utils import timezone
from PIL import Image as PILImage
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile

User = get_user_model()

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
        address_parts = []
        if self.street_number:
            address_parts.append(self.street_number)
        if self.street_name:
            address_parts.append(self.street_name)
        if self.suburb:
            address_parts.append(self.suburb)
        
        address = ' '.join(address_parts) if address_parts else 'No address'
        return f"{address} - {self.date}"

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

def alarm_image_path(instance, filename):
    # Clean the filename to prevent any path traversal
    # Get the file extension
    ext = os.path.splitext(filename)[1].lower()
    
    # Create a clean filename using timestamp
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    
    # Generate path like: alarm_images/alarm_123/20240321_123456.jpg
    clean_filename = f"{timestamp}{ext}"
    return f'alarm_images/alarm_{instance.alarm.id}/{clean_filename}'

class AlarmImage(models.Model):
    alarm = models.ForeignKey(Alarm, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=alarm_image_path)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        # If we're setting a specific upload time, we need to handle it before auto_now_add takes effect
        update_time = kwargs.pop('update_time', None)
        
        if self.image:
            # Open the image using PIL
            img = PILImage.open(self.image)
            
            # Convert RGBA to RGB if needed
            if img.mode == 'RGBA':
                # Create a white background
                background = PILImage.new('RGB', img.size, (255, 255, 255))
                # Paste the image on the background using alpha channel
                background.paste(img, mask=img.split()[3])  # 3 is the alpha channel
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Resize if larger than max dimensions
            if img.height > 1200 or img.width > 1200:
                output_size = (1200, 1200)
                img.thumbnail(output_size, PILImage.Resampling.LANCZOS)

            # Save the processed image
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            self.image = InMemoryUploadedFile(
                buffer,
                'ImageField',
                f"{os.path.splitext(self.image.name)[0]}.jpg",
                'image/jpeg',
                buffer.getbuffer().nbytes,
                None
            )

        # First save without the update_time to let the model handle the file
        super().save(*args, **kwargs)
        
        # If we have an update_time, set it after the initial save
        if update_time:
            AlarmImage.objects.filter(pk=self.pk).update(uploaded_at=update_time)

    def __str__(self):
        return f"Image for Alarm {self.alarm.id} uploaded at {self.uploaded_at.strftime('%Y-%m-%d %H:%M')}"

class AlarmUpdate(models.Model):
    UPDATE_TYPE_CHOICES = [
        ('call_attempt', 'Call Attempt'),
        ('customer_contact', 'Customer Contact'),
        ('status_change', 'Status Change'),
        ('general_note', 'General Note'),
    ]

    alarm = models.ForeignKey(Alarm, on_delete=models.CASCADE, related_name='updates')
    update_type = models.CharField(max_length=50, choices=UPDATE_TYPE_CHOICES)
    note = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='alarm_updates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_update_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-created_at']  # Most recent updates first
