from decimal import Decimal
from django.db import IntegrityError, models
from django.forms import ValidationError
from django.urls import reverse
from django.dispatch import receiver
from django.utils import timezone
from barcode.writer import ImageWriter
from PIL import Image, ImageOps
from django.db import transaction
import barcode, string, random
from io import BytesIO
from django.core.files import File
from django.db.models.signals import post_save, post_delete
from users.models import Room
from django.contrib.auth import get_user_model
from cloudinary.models import CloudinaryField

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='category_images', null=True, blank=True)

    def __str__(self):
        return self.name

class Item(models.Model):
    CONDITION_CHOICES = (
        ('Consumables', 'Consumables'),
        ('Non-Consumables', 'Non-Consumables'),
    )
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    item_type = models.CharField(max_length=20, choices=CONDITION_CHOICES,  default='Non-Consumables')
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"
    
    def total_instances(self):
        return self.instances.count()
    def available_instances(self):
        # If the item type is Non-Consumables and total quantity is 0, return 0
        if self.item_type == 'Non-Consumables' and self.quantity == 0:
            return 0
        
        # Get all equipment instances IDs that are currently borrowed
        borrowed_instance_ids = BorrowRecord.objects.filter(
            item_instance__item=self,
            return_date__isnull=True
        ).values_list('item_instance_id', flat=True)
        
        # Count instances that are not in the borrowed list
        available = self.instances.exclude(
            id__in=borrowed_instance_ids
        )
        
        # For Consumables, consider the remaining quantity
        if self.item_type == 'Consumables':
            return available.aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # For Non-Consumables, count the number of instances
        return available.count()
    
    def update_total_quantity(self):
        total = ItemInstance.objects.filter(
            item=self
        ).aggregate(
            total_quantity=models.Sum('quantity')
        )['total_quantity'] or 0
        
        self.quantity = total
        self.save()
    
    def get_latest_start_number(self):
        latest_instance = ItemInstance.objects.filter(
            item=self
        ).order_by('-inventory_number').first()
        
        if latest_instance:
            try:
                start_number = int(latest_instance.inventory_number.split('-')[3])
                return start_number
            except (IndexError, ValueError):
                return 0
        return 0

    
    def calculate_total_quantity(self):
        if self.item_type == 'Consumables':
            self.quantity =  self.instances.aggregate(total=models.Sum('quantity'))['total'] or 0
        else:
            self.quantity = self.instances.count()
        self.save()

class ItemInstance(models.Model):
    CONDITION_CHOICES = (
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
        ('Damaged', 'Damaged'),
    ) 

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='instances')
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=0)
    purchase_date = models.DateField(null=True, blank=True)

    serial_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    inventory_number = models.CharField(max_length=100, unique=True, null=True, blank=True)

    current_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, blank=True, null=True, default='Good')
    last_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, blank=True, null=True)

    barcode = CloudinaryField('barcode', folder='barcode/item_barcodes', null=True, blank=True)
    useful_life = models.PositiveIntegerField(null=True, blank=True)
    
    def __str__(self):
        return f'{self.item.name} ({self.serial_number})'

    def borrow_count(self):
        return BorrowRecord.objects.filter(item_instance=self).count()

    def get_current_borrow_record(self):
        return self.borrowrecords.filter(return_date__isnull=True).first()

    def get_last_borrow_record(self): 
        return self.borrowrecords.filter(return_date__isnull=False).order_by('-return_date').first()



    @classmethod
    def most_borrowed_overall(cls, limit=10):
        return cls.objects.annotate(total_borrow_count=models.Count('borrowrecord')).order_by('-total_borrow_count')[:limit]

    def generate_barcode(self):
        code = barcode.get('code128', str(self.inventory_number), writer=ImageWriter())
        buffer = BytesIO() 
        code.write(buffer)

        image = Image.open(buffer)
        new_size = (400, 200)  
        image = image.resize(new_size, Image.LANCZOS)
        padding = 20
        image = ImageOps.expand(image, border=padding, fill='white')

        buffer = BytesIO()
        image.save(buffer, format='PNG')
        self.barcode.save(f'item_barcodec{self.inventory_number}.png', File(buffer), save=False)

    @staticmethod
    def generate_serial(item_model):
        # Generate a random suffix
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"{item_model}-{random_suffix}"

    def update_quantity(self):
        total_used = BorrowRecord.objects.filter(
            item_instance=self
        ).aggregate(
            total=models.Sum('quantity')
        )['total'] or 0
        
        self.volume = self.quantity - total_used
        self.is_depleted = self.volume <= 0
        self.save()
        
        self.item.update_total_quantity()



@receiver(post_delete, sender=ItemInstance)
def update_item_total_quantity_on_instance_delete(sender, instance, **kwargs):
    instance.item.calculate_total_quantity()

@receiver(post_delete, sender=ItemInstance)
def delete_qr_code_file(sender, instance, **kwargs):
    if instance.barcode:
        instance.barcode.delete(False)

@receiver(post_delete, sender=ItemInstance)
def update_item_total_quantity_on_instance_delete(sender, instance, **kwargs):
    instance.item.calculate_total_quantity() 
    instance.item.save() 


class BorrowRecord(models.Model):
    item_instance = models.ForeignKey(ItemInstance, on_delete=models.CASCADE, related_name='borrowrecords')
    quantity = models.PositiveIntegerField(default=0)
    borrower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='currently_borrowed_items', blank=True, null=True)
    custom_borrower = models.TextField(blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=True, blank=True)
    borrow_date = models.DateTimeField(auto_now_add=True)
    duration = models.PositiveIntegerField(null=True, blank=True)
    return_date = models.DateTimeField(null=True, blank=True)
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
        ordering = ['-borrow_date']

    def get_borrower(self):
        current_record = self
        return current_record.borrower.first_name + ' ' + current_record.borrower.last_name if current_record.borrower else current_record.custom_borrower

class ReturnRecord(models.Model):
    item_instance = models.ForeignKey(ItemInstance, on_delete=models.CASCADE)
    borrow_record = models.OneToOneField(BorrowRecord, on_delete=models.CASCADE)
    return_date = models.DateTimeField(default=timezone.now)
    condition_on_return = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Return of {self.item_instance} on {self.return_date}"

    class Meta:
        ordering = ['-return_date']
