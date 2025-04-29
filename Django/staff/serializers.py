from rest_framework import serializers
from .models import Status, DisposeRequest, TransferRequest, ReplaceRequest
from users.serializers import UserSerializer, RoomSerializer


from users.models import Room, User
from labtech.models import ApparatusBorrowRecord, EquipmentBorrowRecord
from secretary.models import BorrowRecord

from secretary.serializers import ItemInstanceSerializer, BorrowRecordSerializer
from labtech.serializers import ApparatusBorrowRecordSerializer, EquipmentBorrowRecordSerializer



class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['status']


class TransferRequestSerializer(serializers.ModelSerializer):
    requested_by = UserSerializer()
    new_assignee = UserSerializer()
    new_location = RoomSerializer()
    requested_by = UserSerializer()
    item_instance = ItemInstanceSerializer()
    processed_by = UserSerializer()


    class Meta:
        model = TransferRequest
        fields = '__all__'

class ReplaceRequestSerializer(serializers.ModelSerializer):
    requested_by = UserSerializer()
    item_instance = ItemInstanceSerializer()
    processed_by = UserSerializer()
    replacement_item = ItemInstanceSerializer()

    
    class Meta:
        model = ReplaceRequest
        fields = '__all__'

    def validate(self, data):
        if data.get('status') == 'APPROVED' and not data.get('replacement_item'):
            raise serializers.ValidationError(
                "Replacement item is required when approving a request"
            )
        return data

class DisposeRequestSerializer(serializers.ModelSerializer):
    requested_by = UserSerializer()
    item_instance = ItemInstanceSerializer()
    processed_by = UserSerializer()

    
    class Meta:
        model = DisposeRequest
        fields = '__all__'


class RoomDetailSerializer(serializers.ModelSerializer):
    current_borrowed_items = serializers.SerializerMethodField()
    current_borrowed_apparatus = serializers.SerializerMethodField()
    current_borrowed_equipments = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = '__all__'


    def get_current_borrowed_items(self, obj):
        borrow_records = BorrowRecord.objects.filter(
            room=obj,
            return_date__isnull=True  
        )
        return BorrowRecordSerializer(borrow_records, many=True).data
    
    def get_current_borrowed_apparatus(self, obj):
        borrow_records = ApparatusBorrowRecord.objects.filter(
            room=obj,
            returned_date__isnull=True  
        )
        return ApparatusBorrowRecordSerializer(borrow_records, many=True).data
    
    def get_current_borrowed_equipments(self, obj):
        borrow_records = EquipmentBorrowRecord.objects.filter(
            room=obj,
            returned_date__isnull=True  
        )
        return EquipmentBorrowRecordSerializer(borrow_records, many=True).data
    

class StaffDetailSerializer(serializers.ModelSerializer):
    current_borrowed_items = serializers.SerializerMethodField()
    current_borrowed_apparatus = serializers.SerializerMethodField()
    current_borrowed_equipments = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [ 'id', 'custom_id', 'username', 'first_name', 'last_name', 'email', 'current_borrowed_items', 'current_borrowed_apparatus', 'current_borrowed_equipments']

    def get_current_borrowed_items(self, obj):
        borrow_records = BorrowRecord.objects.filter(
            borrower=obj,
            return_date__isnull=True  
        )
        return BorrowRecordSerializer(borrow_records, many=True).data
    
    def get_current_borrowed_apparatus(self, obj):
        borrow_records = ApparatusBorrowRecord.objects.filter(
            borrower=obj,
            returned_date__isnull=True  
        )
        return ApparatusBorrowRecordSerializer(borrow_records, many=True).data
    
    def get_current_borrowed_equipments(self, obj):
        borrow_records = EquipmentBorrowRecord.objects.filter(
            borrower=obj,
            returned_date__isnull=True  
        )
        return EquipmentBorrowRecordSerializer(borrow_records, many=True).data