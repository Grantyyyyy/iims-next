from .models import Room, Department, User
from django.contrib.auth.models import AbstractUser
from secretary.models import ItemInstance, BorrowRecord

from rest_framework import serializers
# from django.contrib.auth import get_user_model

# User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Department
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department', write_only=True, required=False, allow_null=True)
    department = DepartmentSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'custom_id', 'username', 'first_name', 'last_name', 'is_active', 'is_secretary', 'is_supply', 'is_dean', 'is_admin', 'is_staff', 'is_superuser', 
                  'is_labtech', 'is_ictc', 'department', 'department_id', 'user_type', 'contact_number', 'barcode', 'email', 'profile_picture', 'barcode_value']
        read_only_fields = ['custom_id', 'barcode']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
    def get_user_type(self, obj):
        return obj.user_type()
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.department is None:
            ret['department'] = None
        return ret
    
    def update(self, instance, validated_data):
        """Handle department updates including null values"""
        # Remove department from validated_data if it's None
        if 'department' in validated_data and validated_data['department'] is None:
            instance.department = None
            validated_data.pop('department')
        
        return super().update(instance, validated_data)
    




class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        # Validate that new_password and confirm_password are the same
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New password and confirm password do not match.")
        return data
    
class RoomSerializer(serializers.ModelSerializer):
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department', write_only=True)
    department = DepartmentSerializer(read_only=True)
    class Meta:
        model = Room
        fields = ['id', 'name', 'location', 'department', 'department_id']

class CurrentBorrowedItemSerializer(serializers.ModelSerializer):
    borrower_name = serializers.SerializerMethodField()
    room = serializers.CharField(source='current_location')

    class Meta:
        model = ItemInstance
        fields = ['id', 'item', 'inventory_number', 'borrower_name', 'room']

    def get_borrower_name(self, obj):
        if obj.borrower:
            return f"{obj.borrower.first_name} {obj.borrower.last_name}"
        else:
            return None
        
class CurrentAssignedItemSerializer(CurrentBorrowedItemSerializer):
    item_name = serializers.CharField(source='item.name')
    assignee = serializers.SerializerMethodField()
    room = serializers.CharField(source='assigned_at')
    current_assigned_record = serializers.SerializerMethodField()

    class Meta:
        model = ItemInstance
        fields = ['id', 'item_name', 'serial_number', 'current_assigned_record', 'assignee',  'assigned_at', 'room']

    def get_assignee(self, obj):
        if obj.assignee:
            return f"{obj.assignee.first_name} {obj.assignee.last_name}"
        else:
            return None
    
    def get_current_assigned_record(self, obj):
        current_record = obj.get_current_assigned_record()
        if current_record:
            return {
                'id': current_record.id,
                'inventory_number': current_record.inventory_number,
                'assignee': current_record.assignee.first_name + ' ' + current_record.assignee.last_name,
                'assigned_date': current_record.assigned_date,
                'assigned_at': current_record.room.name if current_record.room else None
            }
        return None


# class StaffDetailSerializer(serializers.ModelSerializer):
#     borrowed_items = serializers.SerializerMethodField()
#     assigned_items = serializers.SerializerMethodField()

#     class Meta:
#         model = User
#         fields = [
#             'id',
#             'first_name',
#             'last_name',
#             'email',
#             'borrowed_items',
#             'assigned_items'
#         ]  

#     def get_borrowed_items(self, obj):
#         current_items = ItemInstance.objects.filter(
#             id__in=BorrowRecord.objects.filter(
#                 borrower=obj, 
#                 return_date__isnull=True
#             ).values('item_instance_id')
#         ).select_related('item')
#         return CurrentBorrowedItemSerializer(current_items, many=True).data

#     def get_assigned_items(self, obj):  
#         current_records = AssignRecord.objects.filter(
#             unassigned_date__isnull=True,
#             assignee=obj,
#         ).select_related('item', 'item_instance', 'room', 'assigned_date')


#         current_items = ItemInstance.objects.filter(
#             id__in=current_records.values('item_instance_id')
#         ).select_related('item')
#         return CurrentAssignedItemSerializer(current_items, many=True).data