import datetime
from rest_framework import serializers
from . models import Item, ItemInstance, BorrowRecord, ReturnRecord, Category
from django.utils import timezone
from users.models import User, Room
from users.serializers import  RoomSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    category = CategorySerializer(read_only=True)

    total_instances = serializers.SerializerMethodField()
    available_instances = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = '__all__' 

    def get_total_instances(self, obj):
        return obj.total_instances()
    
    def get_available_instances(self, obj):
        return obj.available_instances()
    

class ItemInstanceSerializer(serializers.ModelSerializer):
    item = serializers.SerializerMethodField()

    current_borrow_record = serializers.SerializerMethodField()
    last_borrow_record = serializers.SerializerMethodField()

    class Meta:
        model = ItemInstance
        fields = '__all__'

    def get_item(self, obj):
        return {
            'name': obj.item.name,
            'description': obj.item.description,
            'category': obj.item.category.name,
            'item_type': obj.item.item_type,
            'model': obj.item.model,
        }

    def get_current_borrow_record(self, obj):
        current_record = obj.get_current_borrow_record()
        if current_record:
            return {
                'id': current_record.id,
                'borrower': current_record.borrower.first_name + ' ' + current_record.borrower.last_name if current_record.borrower else current_record.custom_borrower,
                'borrow_date': current_record.borrow_date,
                'room': current_record.room.name if current_record.room else None
            }
        return None

    
    def get_last_borrow_record(self, obj):
        last_record = obj.borrowrecords.filter(return_date__isnull=False).order_by('-return_date').first()
        if last_record:
            return {
                'id': last_record.id,
                'borrower': last_record.borrower.first_name + ' ' + last_record.borrower.last_name if last_record.borrower else last_record.custom_borrower,
                'return_date': last_record.return_date,
                'room': last_record.room.name if last_record.room else None
            }
        return None


    

class BorrowRecordSerializer(serializers.ModelSerializer):
    borrower = serializers.SerializerMethodField()
    room = RoomSerializer()
    item_instance = ItemInstanceSerializer()

    class Meta:
        model = BorrowRecord
        fields = ['id', 'item_instance', 'quantity', 'borrower', 'room', 'custom_borrower' ,'borrow_date', 'return_date', 'purpose']
        extra_kwargs = {
            'borrow_date': {'default': serializers.CreateOnlyDefault(timezone.now)},
            'borrower': {'required': False},
            'custom_borrower': {'required': False}

        }    

    def get_borrower(self, obj):
        borrower = obj.borrower
        if borrower:
            return f"{borrower.first_name} {borrower.last_name}"
        return obj.custom_borrower

class ReturnRecordSerializer(serializers.ModelSerializer):
    borrow_record = BorrowRecordSerializer()
    item_instance = ItemInstanceSerializer()


    class Meta:
        model = ReturnRecord
        fields = '__all__'
        extra_kwargs = {
            'return_date': {'default': serializers.CreateOnlyDefault(timezone.now)}
        }
    
class BorrowItemSerializer(serializers.Serializer):
    item_name = serializers.CharField(source='item.name')
    borrower_name = serializers.CharField(source='borrowed_by.username')

    class Meta:
        model = ItemInstance
        fields = ['id', 'item_name', 'serial_number', 'borrower_name', 'borrowed_at']




        