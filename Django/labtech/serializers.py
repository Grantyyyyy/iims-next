from base64 import b64encode
from django.conf import settings
from django.contrib.staticfiles.storage import staticfiles_storage
import os

import urllib
from rest_framework import serializers
from django.utils import timezone
from .models import *
from users.serializers import UserSerializer, RoomSerializer

from django.contrib.auth import get_user_model


User = get_user_model()

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'
    
class LabCategorySerializer(serializers.ModelSerializer):
    total_instances = serializers.SerializerMethodField()
    total_apparatus = serializers.SerializerMethodField()
    class Meta:
        model = LabCategory
        fields = '__all__'

    def get_total_instances(self, obj):
        return EquipmentInstance.objects.filter(equipment__category=obj).count()
    
    def get_total_apparatus(self, obj):
        return ApparatusInstance.objects.filter(apparatus__category=obj).count()

class EquipmentSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=LabCategory.objects.all(), source='category', write_only=True)
    category = LabCategorySerializer(read_only=True)
    total_instances = serializers.SerializerMethodField()
    available_instances = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = '__all__'

    def get_total_instances(self, obj):
        return obj.total_instances()

    def get_available_instances(self, obj):
        return obj.available_instances()
    
    def validate_name(self, value):
        instance = self.instance
        
        queryset = Equipment.objects.filter(name__iexact=value)
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Equipment with this name already exists.")
        
        return value


class EquipmentInstanceCreateSerializer(serializers.ModelSerializer):
    inventory_date = serializers.DateField(format='%Y-%m-%d')
    
    class Meta:
        model = EquipmentInstance
        fields = ['equipment', 'quantity', 'unit_cost', 'inventory_date', 'start_number', 'suffix']

class EquipmentInstanceSerializer(serializers.ModelSerializer):

    equipment = serializers.SerializerMethodField()
    current_borrow_record = serializers.SerializerMethodField()
    last_borrow_record = serializers.SerializerMethodField()
    barcode_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EquipmentInstance
        fields = '__all__'

    def get_equipment(self, obj):
        return {
            'name': obj.equipment.name,
            'description': obj.equipment.description,
            'model': obj.equipment.model,
            'category': obj.equipment.category.name
        }

    
    def get_current_borrow_record(self, obj):
        current_record = obj.get_current_borrower()
        if current_record:
            return {
                'id': current_record.id,
                'borrower': current_record.borrower.first_name + ' ' + current_record.borrower.last_name if current_record.borrower else current_record.custom_borrower,
                'borrowed_date': current_record.borrowed_date,
                # 'condition': current_record.current_condition,
                'subject': current_record.subject.name if current_record.subject else None,
                'room': current_record.room.name if current_record.room else None
            }
        return None
    
    def get_last_borrow_record(self, obj):
        last_record = obj.get_last_borrower()
        if last_record:
            return {
                'id': last_record.id,
                'borrower': last_record.borrower.first_name + ' ' + last_record.borrower.last_name if last_record.borrower else last_record.custom_borrower,
                # 'condition': last_record.last_condition,
                'borrowed_date': last_record.borrowed_date,
                'returned_date': last_record.returned_date,
                'room': last_record.room.name if last_record.room else None
            }
        return None
    
    def get_barcode_url(self, obj):
        """Return the proper URL for the barcode image"""
        if not obj.barcode:
            return None
            
        # If it's already a complete URL (like from Cloudinary)
        if isinstance(obj.barcode, str) and (
            obj.barcode.startswith('http://') or 
            obj.barcode.startswith('https://')
        ):
            # Return the URL as is, without prefixing
            return obj.barcode
            
        # For local file storage
        request = self.context.get('request')
        if request and hasattr(obj.barcode, 'url'):
            return request.build_absolute_uri(obj.barcode.url)
        return None
    
    


class EquipmentAssignmentRecordSerializer(serializers.ModelSerializer):
    equipment_instance = EquipmentInstanceSerializer()
    assignee = serializers.SerializerMethodField()
    assigned_location = serializers.SerializerMethodField()

    class Meta:
        model = EquipmentAssignmentRecord
        fields = ['id', 'inventory_number', 'equipment_instance', 'assignee', 'assigned_location', 'quantity', 'assigned_date']

    def get_assignee(self, obj):
        if obj.assignee: 
            return obj.assignee.first_name + ' ' + obj.assignee.last_name


    def get_assigned_location(self, obj):
        if obj.assigned_location:
            return obj.assigned_location.name
    
    def get_assigned_date(self, obj):
        if obj.assigned_date:
            return obj.assigned_date


class EquipmentBorrowRecordSerializer(serializers.ModelSerializer):
    borrower= serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    equipment_instance = EquipmentInstanceSerializer()

    class Meta:
        model = EquipmentBorrowRecord
        fields = ['id', 'equipment_instance', 'borrower', 'custom_borrower', 'borrowed_date', 'returned_date', 'room', 'subject',  'purpose' ]

    def get_borrower(self, obj):
        borrower = obj.borrower
        if borrower:
            return f"{borrower.first_name} {borrower.last_name}"
        return obj.custom_borrower
    
    def get_room(self, obj):
        if obj.room:
            return obj.room.name
        
    def get_subject(self, obj):
        if obj.subject:
            return obj.subject.name
    
class EquipmentReturnRecordSerializer(serializers.ModelSerializer):
    borrow_record = EquipmentBorrowRecordSerializer()
    equipment_instance = EquipmentInstanceSerializer()

    class Meta:
        model = EquipmentReturnRecord
        fields = '__all__'

class ChemicalSerializer(serializers.ModelSerializer):
    active_volume = serializers.SerializerMethodField()
    
    class Meta:
        model = Chemical
        fields = '__all__'
    
    def get_active_volume(self, obj):
        today = timezone.now().date()
        total = ChemicalStock.objects.filter(
            chemical=obj,
            expiry_date__gt=today,
        ).aggregate(
            total_volume=models.Sum('volume')
        )['total_volume'] or 0
        
        return total
    
    def validate_name(self, value):
        instance = self.instance
        
        queryset = Chemical.objects.filter(name__iexact=value)
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Chemical with this name already exists.")
        
        return value


class ChemicalStockSerializer(serializers.ModelSerializer):
    chemical = ChemicalSerializer(read_only=True)
    inventory_number = serializers.CharField(read_only=True)

    class Meta:
        model = ChemicalStock
        fields = '__all__'  

class ChemicalUsageSerializer(serializers.ModelSerializer):
    requested_chemical = ChemicalStockSerializer(read_only=True)
    borrower = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    room = RoomSerializer(read_only=True)

    date_used = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')

    class Meta:
        model = ChemicalUsage
        fields = ['id', 'requested_chemical', 'borrower', 'subject', 'room', 'quantity_used', 'quantity_requested', 'request_unit', 'date_used',  'purpose']
        extra_kwargs = {
            'room': {'required': False},
        }

    def get_borrower(self, obj):
        if obj.borrower:
            return f"{obj.borrower.first_name} {obj.borrower.last_name}"
        return None
    
    def get_subject(self, obj):
        if obj.subject:
            return obj.subject.name

        

class ApparatusSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=LabCategory.objects.all(), source='category', write_only=True)
    total_instances = serializers.SerializerMethodField()
    available_instances = serializers.SerializerMethodField()
    category = LabCategorySerializer(read_only=True)

    class Meta:
        model = Apparatus
        fields = '__all__'

    def get_total_instances(self, obj):
        return obj.instances.count() if obj.instances else 0
    
    def get_available_instances(self, obj):
        return obj.available_instances()
    
    def validate_name(self, value):
        instance = self.instance
        
        queryset = Apparatus.objects.filter(name__iexact=value)
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Apparatus with this name already exists.")
        
        return value



class ApparatusInstanceSerializer(serializers.ModelSerializer):
    apparatus = serializers.SerializerMethodField()
    current_borrow_record = serializers.SerializerMethodField()
    last_borrow_record = serializers.SerializerMethodField()
    barcode_url = serializers.SerializerMethodField()

    class Meta:
        model = ApparatusInstance
        fields = '__all__'

    def get_apparatus(self, obj):
        return {
            'name': obj.apparatus.name,
            'description': obj.apparatus.description,
            'apparatus_type': obj.apparatus.apparatus_type
        }

    def get_current_borrow_record(self, obj):
        current_record = obj.get_current_borrow_record()
        if current_record:
            return {
                'id': current_record.id,
                'borrower': current_record.borrower.first_name + ' ' + current_record.borrower.last_name if current_record.borrower else current_record.custom_borrower,
                'borrowed_date': current_record.borrowed_date,
                'subject': current_record.subject.name if current_record.subject else None,
                'room': current_record.room.name if current_record.room else None
            }
        return None
    
    def get_last_borrow_record(self, obj):
        last_record = obj.get_last_borrow_record()
        if last_record:
            return {
                'id': last_record.id,
                'borrower': last_record.borrower.first_name + ' ' + last_record.borrower.last_name if last_record.borrower else last_record.custom_borrower,
                'borrowed_date': last_record.borrowed_date,
                'returned_date': last_record.returned_date,
                'subject': last_record.subject.name if last_record.subject else None,
                'room': last_record.room.name if last_record.room else None
            }
        return None
    
    def get_barcode_url(self, obj):
        """Return the proper URL for the barcode image"""
        if not obj.barcode:
            return None
            
        # If it's already a complete URL (like from Cloudinary)
        if isinstance(obj.barcode, str) and (
            obj.barcode.startswith('http://') or 
            obj.barcode.startswith('https://')
        ):
            # Return the URL as is, without prefixing
            return obj.barcode
            
        # For local file storage
        request = self.context.get('request')
        if request and hasattr(obj.barcode, 'url'):
            return request.build_absolute_uri(obj.barcode.url)
        return None
    
    
class ApparatusBorrowRecordSerializer(serializers.ModelSerializer):
    borrower = serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    apparatus_instance = ApparatusInstanceSerializer()

    class Meta:
        model = ApparatusBorrowRecord
        fields = '__all__'

    def get_borrower(self, obj):
        if obj.borrower:
            return obj.borrower.first_name + ' ' + obj.borrower.last_name
        return obj.custom_borrower
    
    def get_room(self, obj):
        if obj.room:
            return obj.room.name
        
    def get_subject(self, obj):
        if obj.subject:
            return obj.subject.name
        
class ApparatusReturnRecordSerializer(serializers.ModelSerializer):
    borrow_record = ApparatusBorrowRecordSerializer()
    apparatus_instance = ApparatusInstanceSerializer()

    class Meta:
        model = ApparatusReturnRecord
        fields = '__all__'
