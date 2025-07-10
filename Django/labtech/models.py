import re
from django.conf import settings
from django.forms import ValidationError
from django.utils import timezone
import random, string
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
import barcode
from django.db import transaction
from barcode.writer import ImageWriter
from io import BytesIO
from django.core.files import File
from PIL import Image, ImageOps
from django.contrib.auth import get_user_model
from users.models import Room
from django.db.models import Q
from django.utils.timezone import now
from django.utils import timezone
from cloudinary.models import CloudinaryField
import cloudinary.uploader


User = get_user_model()

class Unit (models.Model):
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10)

    def __str__(self):
        return self.name

class LabCategory(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='equipment_categories', null=True, blank=True)

    def __str__(self):
        return f"{self.name}"
    
class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return f"{self.name}"

class Equipment(models.Model):
    CONDITION_CHOICES = (
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
        ('Damaged', 'Damaged'),
    )

    name = models.CharField(max_length=100)
    category = models.ForeignKey(LabCategory, null=True, blank=True, on_delete=models.CASCADE)
    model = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"
    
    def get_category(self):
        return self.category
    
    def total_instances(self):
        return self.equipment_instances.count()
    def available_instances(self):
        # Get all equipment instances IDs that are currently borrowed
        borrowed_instance_ids = EquipmentBorrowRecord.objects.filter(
            equipment_instance__equipment=self,
            returned_date__isnull=True
        ).values_list('equipment_instance_id', flat=True)
        
        # Count instances that are not in the borrowed list
        return self.equipment_instances.exclude(
            id__in=borrowed_instance_ids
        ).count()


    def calculate_total_quantity(self):
        self.quantity = self.equipment_instances.count()
        self.save()


class EquipmentInstance(models.Model):
    CONDITION_CHOICES = (
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
        ('Damaged', 'Damaged'),
    )

    STATUS_CHOICES = (
        ('Inactive', 'Inactive'),
        ('Active', 'Active')
    )   

    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='equipment_instances')
    quantity = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    inventory_number = models.CharField(max_length=100, unique=True)
    useful_life = models.PositiveIntegerField(default=0)
    purchase_date = models.DateField(null=True, blank=True)

    serial_number = models.CharField(max_length=100, unique=True, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Inactive')

    current_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, blank=True, null=True, default='Good')
    last_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, blank=True, null=True)

    barcode = CloudinaryField('barcode', folder='barcode/equipment_barcodes', null=True, blank=True)

    
    def get_current_borrower(self):
        return self.equipmentborrowrecord.filter(returned_date__isnull=True).order_by('-borrowed_date').first()
    
    def get_last_borrower(self):
        return self.equipmentborrowrecord.filter(returned_date__isnull=False).order_by('-returned_date').first()

    def __str__(self):
        return f'{self.quantity} - {self.equipment.name} ({self.status})'
    
    def borrow_count(self):
        return EquipmentBorrowRecord.objects.filter(equipment_instance=self).count()

    def is_frequently_borrowed(self, threshold=5):
        return self.borrow_count() >= threshold 

    def generate_barcode(self):
        if not self.inventory_number:
            raise ValueError("Inventory number must be set before generating barcode.")
        code = barcode.get('code128', str(self.inventory_number), writer=ImageWriter())
        buffer = BytesIO() 
        code.write(buffer)

        image = Image.open(buffer)
        image = image.resize((400, 200), Image.LANCZOS)
        image = ImageOps.expand(image, border=20, fill='white')

        final_buffer = BytesIO()
        image.save(final_buffer, format='PNG')
        final_buffer.seek(0)

        if 'cloudinary' in settings.DEFAULT_FILE_STORAGE or hasattr(self.barcode, 'upload'):
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                final_buffer,
                folder='barcode/equipment_barcodes',
                public_id=f'{self.inventory_number}',
                overwrite=True,
                resource_type="image"
            )
            # Store just the secure URL
            self.barcode = upload_result['secure_url']
        else:
            barcode_name = f'barcode/equipment_barcodes/{self.inventory_number}.png'
            self.barcode.save(barcode_name, ContentFile(final_buffer.getvalue()), save=False)



    
    
@receiver(post_delete, sender=EquipmentInstance)
def update_item_total_quantity_on_instance_delete(sender, instance, **kwargs):
    instance.equipment.calculate_total_quantity()

@receiver(post_delete, sender=EquipmentInstance)
def delete_qr_code_file(sender, instance, **kwargs):
    if instance.barcode:
        instance.barcode.delete(False)

@receiver(post_delete, sender=EquipmentInstance)
def update_item_total_quantity_on_instance_delete(sender, instance, **kwargs):
    instance.equipment.calculate_total_quantity() 
    instance.equipment.save() 
    

class EquipmentAssignmentRecord(models.Model):
    inventory_number = models.CharField(max_length=100, unique=True)
    equipment_instance = models.ForeignKey(EquipmentInstance, on_delete=models.CASCADE, related_name='equipmentassignmentrecord')
    quantity = models.PositiveIntegerField(default=0)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_records')
    assigned_date = models.DateTimeField(null=True, blank=True)
    assigned_location = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_records')
    unassigned_date = models.DateTimeField(null=True, blank=True)

    def generate_inventory_number(self):
        current_date = timezone.now().strftime('%Y-%m-%d')

        with transaction.atomic():
            latest_record = EquipmentAssignmentRecord.objects.filter(
                assigned_date__date=timezone.now().date(),
                assignee=self.assignee
            ).order_by('-assigned_date').first()

            # Start from 1 if no previous records, otherwise increment
            if latest_record:
                last_number = int(latest_record.inventory_number.split('-')[-2])
                increment_number = f'{last_number + 1:04d}'
            else:
                increment_number = '0001'

            inventory_number = f'{current_date}-{increment_number}-{self.assignee.id}'

            while EquipmentAssignmentRecord.objects.filter(inventory_number=inventory_number).exists():
                last_number = int(increment_number)
                increment_number = f'{last_number + 1:04d}'
                inventory_number = f'{current_date}-{increment_number}-{self.assignee.id}'

        return inventory_number


    def save(self, *args, **kwargs):
        if not self.inventory_number:
            self.inventory_number = self.generate_inventory_number()
        super().save(*args, **kwargs)


class EquipmentBorrowRecord(models.Model):

    equipment_instance = models.ForeignKey(EquipmentInstance, on_delete=models.CASCADE, related_name='equipmentborrowrecord')
    quantity = models.PositiveIntegerField(default=0)
    borrower = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipmentborrowrecord')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    custom_borrower = models.TextField(blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    borrowed_date = models.DateTimeField(null=True, blank=True)
    returned_date = models.DateTimeField(null=True, blank=True)
    purpose = models.TextField(blank=True, null=True)
    

    def clean(self):
        if not self.borrower and not self.custom_borrower:
            raise ValidationError("Either 'borrower' or 'custom_borrower' must be provided.")
        if self.borrower and self.custom_borrower:
            raise ValidationError("'borrower' and 'custom_borrower' cannot both be set.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-borrowed_date']
    
    def get_borrower(self):
        current_record = self
        return current_record.borrower.first_name + ' ' + current_record.borrower.last_name if current_record.borrower else current_record.custom_borrower


class EquipmentReturnRecord(models.Model):
    equipment_instance = models.ForeignKey(EquipmentInstance, on_delete=models.CASCADE, related_name='equipmentreturnrecord')
    borrow_record = models.ForeignKey(EquipmentBorrowRecord, on_delete=models.CASCADE)
    returned_date = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-returned_date']

class Apparatus(models.Model):
    APPARATUS_TYPE = (
        ('Consumables', 'Consumables'),
        ('Non-Consumables', 'Non-Consumables'),
    )

    name = models.CharField(max_length=100)
    # unit = models.ForeignKey(Unit, on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(LabCategory, null=True, blank=True, on_delete=models.CASCADE)
    apparatus_type = models.CharField(max_length=20, choices=APPARATUS_TYPE, default='Non-Consumables')
    description = models.TextField(blank=True, null=True)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return self.name 
    
    def total_instances(self):
        return self.instances.count()

    def available_instances(self):
        # If the item type is Non-Consumables and total quantity is 0, return 0
        if self.apparatus_type == 'Non-Consumables' and self.quantity == 0:
            return 0
        
        # Get all equipment instances IDs that are currently borrowed
        borrowed_instance_ids = ApparatusBorrowRecord.objects.filter(
            apparatus_instance__apparatus=self,
            returned_date__isnull=True
        ).values_list('apparatus_instance_id', flat=True)
        
        # Count instances that are not in the borrowed list
        available = self.instances.exclude(
            id__in=borrowed_instance_ids
        )
        
        # For Consumables, consider the remaining quantity
        if self.apparatus_type == 'Consumables':
            return available.aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # For Non-Consumables, count the number of instances
        return available.count()
    
class ApparatusInstance(models.Model):

    CONDITION_CHOICES = (
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
        ('Damaged', 'Damaged'),
    )

    apparatus = models.ForeignKey(Apparatus, on_delete=models.CASCADE, related_name='instances')
    serial_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    inventory_number = models.CharField(max_length=100, unique=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)

    current_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, blank=True, null=True, default='Good')
    last_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, blank=True, null=True)

    barcode = CloudinaryField('barcode', folder='barcode/apparatus_barcode', null=True, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    useful_life = models.PositiveIntegerField(default=0)
    

    def __str__(self):
        return f"{self.apparatus.name} - {self.inventory_number}"
    
    def get_current_borrow_record(self):
        return self.apparatusborrowrecords.filter(returned_date__isnull=True).order_by('-borrowed_date').first()
    
    def get_last_borrow_record(self):
        return self.apparatusborrowrecords.filter(returned_date__isnull=False).order_by('-returned_date').first()
    

    
    def generate_barcode(self):
        if not self.inventory_number:
            raise ValueError("Inventory number must be set before generating barcode.")
        code = barcode.get('code128', str(self.inventory_number), writer=ImageWriter())
        buffer = BytesIO() 
        code.write(buffer)

        image = Image.open(buffer)
        image = image.resize((400, 200), Image.LANCZOS)
        image = ImageOps.expand(image, border=20, fill='white')

        final_buffer = BytesIO()
        image.save(final_buffer, format='PNG')
        final_buffer.seek(0)

        if 'cloudinary' in settings.DEFAULT_FILE_STORAGE or hasattr(self.barcode, 'upload'):
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                final_buffer,
                folder='barcode/apparatus_barcode',
                public_id=f'{self.inventory_number}',
                overwrite=True,
                resource_type="image"
            )
            
            # Store just the secure URL
            self.barcode = upload_result['secure_url']
        else:
            barcode_name = f'barcode/apparatus_barcode/{self.inventory_number}.png'
            self.barcode.save(barcode_name, File(final_buffer), save=False)
    
class Chemical(models.Model):
    UNIT_CHOICES = (
        ('l', 'l'),
        ('ml', 'ml'),
        ('g', 'g'),
        ('kg', 'kg'),
        ('gal' , 'gal'),

    )
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, blank=True, null=True)
    description = models.TextField(blank=True)
    volume = models.DecimalField(max_digits=10, decimal_places=5, default=0)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=0)



    
    def update_total_volume(self):
        """Update total volume based on all available chemical stocks"""
        today = timezone.now().date()


        total = ChemicalStock.objects.filter(
            chemical=self,
            expiry_date__gt=today,
        ).aggregate(
            total_volume=models.Sum('volume')
        )['total_volume'] or 0
        
        self.volume = total
        self.save()

    def __str__(self):
        return f"{self.name} {self.volume}" 
    
class ChemicalStock(models.Model):
    chemical = models.ForeignKey(Chemical, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=5, default=0)
    purchase_date = models.DateField(null=True, blank=True)
    inventory_number = models.CharField(max_length=100, unique=True)

    volume = models.DecimalField(max_digits=10, decimal_places=5, default=0)
    expiry_date = models.DateField(null=True, blank=True)
    barcode = CloudinaryField('barcode', folder='barcodes/chemical_barcode', null=True, blank=True)

    def __str__(self):
        return f" - {self.chemical} ({self.inventory_number})"
    
    @staticmethod
    def most_assigned_chemical():
        most_assigned = ChemicalStock.objects.annotate(
            total_assignments=models.Count('assignrecords')).order_by('-total_assignments').first()
        
        return most_assigned

    def update_volume(self):
        # Calculate how much of this stock has been used
        total_used = ChemicalUsage.objects.filter(
            chemical_stock=self
        ).aggregate(
            total=models.Sum('quantity_used')
        )['total'] or 0
        
        self.volume = self.volume - total_used  # Assuming initial volume is stored in self.volume
        self.is_depleted = self.volume <= 0
        self.save()
        
        # Update the parent chemical's total volume, which will exclude expired stocks
        self.chemical.update_total_volume()

    def generate_barcode(self):
        if not self.inventory_number:
            raise ValueError("Inventory number must be set before generating barcode.")
        code = barcode.get('code128', str(self.inventory_number), writer=ImageWriter())
        buffer = BytesIO() 
        code.write(buffer)

        image = Image.open(buffer)
        image = image.resize((400, 200), Image.LANCZOS)
        image = ImageOps.expand(image, border=20, fill='white')

        final_buffer = BytesIO()
        image.save(final_buffer, format='PNG')
        final_buffer.seek(0)

        if 'cloudinary' in settings.DEFAULT_FILE_STORAGE or hasattr(self.barcode, 'upload'):
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                final_buffer,
                folder='barcodes/chemical_barcode',
                public_id=f'{self.inventory_number}',
                overwrite=True,
                resource_type="image"
            )
            
            # Store just the secure URL
            self.barcode = upload_result['secure_url']
        else:
            # For regular Django file storage
            barcode_name = f'barcodes/chemical_barcode/{self.inventory_number}.png'
            self.barcode.save(barcode_name, ContentFile(final_buffer.getvalue()), save=False)




# @receiver(post_delete, sender=ChemicalStock)
# def cleanup_chemical_stock(sender, instance, **kwargs):
#     if instance.barcode:
#         instance.barcode.delete(False)
#     instance.chemical.update_total_volume()

class ChemicalUsage(models.Model):
    requested_chemical = models.ForeignKey(ChemicalStock, on_delete=models.CASCADE)
    borrower = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True)
    quantity_used = models.DecimalField(max_digits=10, decimal_places=5, default=0)
    quantity_requested = models.DecimalField(max_digits=10, decimal_places=5, null=True, blank=True)
    request_unit = models.CharField(max_length=10, blank=True, null=True)
    purpose = models.TextField(null=True, blank=True)
    date_used = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        room_info = f" - Room: {self.room}" if self.room else ""
        return f"Usage by {self.borrower}{room_info} - Amount: {self.quantity_used}"
    
    def clean(self):
        if self.requested_chemical.remaining_volume < self.quantity_used:
            raise ValidationError("Cannot use more volume than available in assignment.")
        
        if self.quantity_used <= 0:
            raise ValidationError("Usage quantity must be greater than 0.")
        
    def get_requested_chemical(self):
        return self.requested_chemical.chemical_stock.chemical.name

@receiver(post_save, sender=ChemicalUsage)
def update_assignment_volume(sender, instance, created, **kwargs):
    if created:
        assignment = instance.requested_chemical
        assignment.volume -= instance.quantity_used
        assignment.save()

@receiver(post_save, sender=ChemicalStock)
def update_chemical_volume(sender, instance, created, **kwargs):
    instance.chemical.update_total_volume()


class ApparatusBorrowRecord(models.Model):
    apparatus_instance = models.ForeignKey(ApparatusInstance, on_delete=models.CASCADE, related_name='apparatusborrowrecords')
    quantity = models.PositiveIntegerField(default=0)
    borrower = models.ForeignKey(User, on_delete=models.CASCADE)
    custom_borrower = models.TextField(blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    borrowed_date = models.DateTimeField(auto_now_add=True)
    returned_date = models.DateTimeField(null=True, blank=True)
    purpose = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.apparatus_instance} borrowed by {self.borrower}"
    
class ApparatusReturnRecord(models.Model):
    apparatus_instance = models.ForeignKey(ApparatusInstance, on_delete=models.CASCADE, related_name='apparatusreturnrecords')
    borrow_record = models.ForeignKey(ApparatusBorrowRecord, on_delete=models.CASCADE)
    returned_date = models.DateTimeField(auto_now=True)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.apparatus_instance} returned by {self.borrow_record.borrower}"