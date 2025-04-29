from django.db import models
from django.forms import ValidationError
from django.utils import timezone
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from django.db import transaction


from barcode.writer import ImageWriter
from PIL import Image, ImageOps
import barcode
from io import BytesIO
from django.core.files import File


from decimal import Decimal
from labtech.models import ChemicalStock
from users.models import Room
from django.contrib.auth import get_user_model


User = get_user_model()


class ChemicalAssignment(models.Model):
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_chemicals')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    chemical_stock = models.ForeignKey(ChemicalStock, on_delete=models.CASCADE)
    assigned_volume = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_volume = models.DecimalField(max_digits=10, decimal_places=2)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_assignments')
    processed_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.assigned_volume} of {self.chemical_stock} assigned to {self.assignee}"

    def clean(self):
        if self.assigned_volume > self.chemical_stock.volume:
            raise ValidationError("Cannot assign more volume than available in stock.")

    def save(self, *args, **kwargs):
        if not self.pk:  # On creation
            self.remaining_volume = self.assigned_volume
            self.chemical_stock.volume -= self.assigned_volume
            self.chemical_stock.save()
        
        super().save(*args, **kwargs)

    def update_remaining_volume(self, used_volume):
        self.remaining_volume -= Decimal(used_volume)
        if self.remaining_volume <= 0:
            self.remaining_volume = 0
            self.is_active = False
        self.save()

    def get_assignee_name(self):
        return self.assignee.first_name + ' ' + self.assignee.last_name
    
    def get_processed_by_name(self):
        return self.processed_by.first_name + ' ' + self.processed_by.last_name
    
    def get_room_name(self):
        return self.room.name
    

    
