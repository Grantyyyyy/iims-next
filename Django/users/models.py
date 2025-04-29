from django.db import models
from django.contrib.auth.models import AbstractUser
import barcode
from django.db.models import Max
from barcode.writer import ImageWriter
from io import BytesIO
from django.core.files import File
from PIL import Image, ImageOps


class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class User(AbstractUser):
    is_secretary = models.BooleanField(default=False)
    is_dean = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)  
    is_superuser = models.BooleanField(default=False)
    is_supply = models.BooleanField(default=False)
    is_labtech = models.BooleanField(default=False)
    is_ictc = models.BooleanField(default=False)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    custom_id = models.IntegerField(unique=True, null=True, blank=True)
    barcode = models.ImageField(upload_to='user_barcodes', blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    barcode_value = models.CharField(max_length=100, unique=True, blank=True, null=True)
    REQUIRED_FIELDS = []


    @classmethod
    def generate_custom_id(cls):
        max_custom_id = cls.objects.aggregate(Max('custom_id'))['custom_id__max'] or 99999
        return max_custom_id + 1

    def save(self, *args, **kwargs):
        if not self.custom_id:
            self.custom_id = self.generate_custom_id()
        if not self.barcode:
            self.generate_barcode()
        super().save(*args, **kwargs)

    def generate_barcode(self):
        code = barcode.get('code128', str(self.custom_id), writer=ImageWriter())
        self.barcode_value = self.custom_id
        buffer = BytesIO()
        code.write(buffer)
        image = Image.open(buffer)
        image = image.resize((400, 200), Image.LANCZOS)
        image = ImageOps.expand(image, border=20, fill='white')
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        self.barcode.save(f'user_barcode_{self.custom_id}.png', File(buffer), save=False)

    def user_type(self):
        if self.is_superuser:
            return "Superuser"
        elif self.is_admin:
            return "Admin"
        elif self.is_secretary:
            return "Secretary"
        elif self.is_labtech:
            return "Lab Technician"
        elif self.is_ictc:
            return "ICT Technician"
        elif self.is_staff:
            return "Staff"
        elif self.is_dean:
            return "Dean"
        elif self.is_supply:
            return "Supply Office"
        else:
            return "User"

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.user_type()})'
    
class Room(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    location = models.CharField(max_length=100)

    def __str__(self):
        return self.name