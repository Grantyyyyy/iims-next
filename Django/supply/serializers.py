from rest_framework import serializers
from django.utils import timezone
from secretary.models import Category, ItemInstance
from secretary.serializers import ItemSerializer
from users.serializers import UserSerializer, RoomSerializer
from .models import ChemicalAssignment
# from .models import Equipment, EquipmentInstance, EquipmentBorrowRecord, EquipmentReturnRecord
from django.contrib.auth import get_user_model


User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    total_instances = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'image', 'total_instances']
    
    def get_total_instances(self, obj):
        return ItemInstance.objects.filter(item__category=obj).count()

class CategoryInstanceSerializer(serializers.ModelSerializer):
    item = ItemSerializer()

    class Meta:
        model = ItemInstance
        fields = '__all__'


class ChemicalAssignmentSerializer(serializers.ModelSerializer):
    assignee_name = serializers.SerializerMethodField()
    processed_by = serializers.SerializerMethodField()
    room_name = serializers.SerializerMethodField()

    class Meta:
        model = ChemicalAssignment
        fields = ['id', 'assignee_name', 'processed_by', 'room_name',  'assigned_volume', 'remaining_volume', 'processed_date',]
        read_only_fields = ['remaining_volume']

    def get_chemical_stock(self, obj):
        return obj.chemical_stock.id  # Example: adjust based on your requirements

    def get_assignee_name(self, obj):
        if obj.assignee:
            return f"{obj.assignee.first_name} {obj.assignee.last_name}"
        return None

    def get_processed_by(self, obj):
        if obj.processed_by:
            return f"{obj.processed_by.first_name} {obj.processed_by.last_name}"
        return None

    def get_room_name(self, obj):
        if hasattr(obj, 'room') and obj.room:  # Ensure `room` is available
            return obj.room.name
        return None

    def get_chemical_name(self, obj):
        if obj.chemical_stock and obj.chemical_stock.chemical:
            return obj.chemical_stock.chemical.name  # Assuming `chemical` has a `name` field
        return None
    
