from django.db import models
from django.contrib.auth import get_user_model
import os
from django.utils.text import slugify
from django.utils import timezone
from PIL import Image as PILImage
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
import gc
import logging

logger = logging.getLogger(__name__)
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
    notes = models.TextField(blank=True, null=True, help_text="Initial notes for the alarm")

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
            try:
                logger.info(f"Starting image processing for {self.image.name}")
                
                # Check file size first - skip processing if too large
                if hasattr(self.image, 'size') and self.image.size > 10 * 1024 * 1024:  # 10MB limit
                    logger.warning(f"Image {self.image.name} is too large ({self.image.size} bytes), skipping processing")
                    # Just save as-is for very large files
                    super().save(*args, **kwargs)
                    if update_time:
                        AlarmImage.objects.filter(pk=self.pk).update(uploaded_at=update_time)
                    return

                # Open the image using PIL with explicit file seeking
                self.image.seek(0)  # Ensure we're at the start of the file
                img = PILImage.open(self.image)
                
                # Get original format and size for logging
                original_size = img.size
                original_format = img.format
                logger.info(f"Processing image: {original_size[0]}x{original_size[1]} {original_format}")

                # Load the image data to ensure it's fully in memory
                img.load()
                
                # Convert RGBA to RGB if needed (memory efficient)
                if img.mode == 'RGBA':
                    logger.info("Converting RGBA to RGB")
                    # Create a white background of the same size
                    background = PILImage.new('RGB', img.size, (255, 255, 255))
                    # Paste the image on the background using alpha channel
                    background.paste(img, mask=img.split()[3])  # 3 is the alpha channel
                    # Clean up original image
                    img.close()
                    img = background
                elif img.mode != 'RGB':
                    logger.info(f"Converting {img.mode} to RGB")
                    old_img = img
                    img = img.convert('RGB')
                    old_img.close()

                # Resize if larger than max dimensions (memory efficient)
                if img.height > 1200 or img.width > 1200:
                    logger.info(f"Resizing image from {img.size[0]}x{img.size[1]} to max 1200x1200")
                    # Calculate new size maintaining aspect ratio
                    ratio = min(1200/img.width, 1200/img.height)
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    
                    # Use thumbnail for memory efficiency
                    old_img = img
                    img = img.resize(new_size, PILImage.Resampling.LANCZOS)
                    old_img.close()
                    
                    # Force garbage collection after resize
                    gc.collect()

                # Save the processed image with optimized settings
                buffer = BytesIO()
                
                # Use optimized JPEG settings for smaller file size
                img.save(buffer, 
                        format='JPEG', 
                        quality=75,  # Reduced from 85 for smaller files
                        optimize=True,  # Enable optimization
                        progressive=True)  # Progressive JPEG for faster loading
                
                # Clean up the PIL image
                img.close()
                
                # Create the Django file object
                buffer.seek(0)
                file_size = buffer.getbuffer().nbytes
                logger.info(f"Processed image size: {file_size} bytes")
                
                self.image = InMemoryUploadedFile(
                    buffer,
                    'ImageField',
                    f"{os.path.splitext(self.image.name)[0]}.jpg",
                    'image/jpeg',
                    file_size,
                    None
                )
                
                # Force garbage collection
                gc.collect()
                logger.info("Image processing completed successfully")
                
            except Exception as e:
                logger.error(f"Error processing image {self.image.name}: {str(e)}")
                # If processing fails, save the original image
                logger.info("Saving original image due to processing error")

        # First save without the update_time to let the model handle the file
        super().save(*args, **kwargs)
        
        # If we have an update_time, set it after the initial save
        if update_time:
            AlarmImage.objects.filter(pk=self.pk).update(uploaded_at=update_time)
        
        # Final garbage collection
        gc.collect()

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
