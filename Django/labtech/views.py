import re
from django.forms import IntegerField
from decimal import Decimal
import uuid
from django.utils import timezone
from django.db.models.functions import TruncDate
from django.db.models import Count, Q, Sum, F, Exists, OuterRef, Subquery, Q


from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.pagination import PageNumberPagination


from supply.models import ChemicalStock
from users.models import Room

from .models import ( Equipment, EquipmentInstance, EquipmentBorrowRecord, EquipmentReturnRecord, 
EquipmentAssignmentRecord, Subject, Chemical, ChemicalStock, ChemicalUsage, ApparatusInstance, Apparatus,
ApparatusBorrowRecord, ApparatusReturnRecord, Unit, LabCategory )

from .serializers import (  EquipmentSerializer, EquipmentInstanceSerializer, EquipmentBorrowRecordSerializer, 
EquipmentAssignmentRecordSerializer, EquipmentReturnRecordSerializer, EquipmentInstanceCreateSerializer, SubjectSerializer, ChemicalSerializer, 
ChemicalStockSerializer, ChemicalUsageSerializer , ApparatusInstanceSerializer, ApparatusSerializer, ApparatusBorrowRecordSerializer,
ApparatusReturnRecordSerializer, UnitSerializer, LabCategorySerializer ) 

from zoneinfo import ZoneInfo

timezone.activate(ZoneInfo("Asia/Manila"))


from users.permissions import IsStaff, IsSecretary, IsLabtech
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404

from django.contrib.auth import get_user_model


User = get_user_model()

class Pagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            total_equipments = Equipment.objects.count()
            total_chemicals = Chemical.objects.count()
            total_apparatus = Apparatus.objects.count()

            chemical_low_stocks = Chemical.objects.filter(volume__lte=F('reorder_level'))
            chemical_recent_usage = ChemicalUsage.objects.order_by('-date_used')[:5]

            current_tz = timezone.get_current_timezone()
            end_date = timezone.now().astimezone(current_tz)
            start_date = (end_date - timezone.timedelta(days=6)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            all_dates = [
                (start_date + timezone.timedelta(days=x)).date() 
                for x in range(6, -1, -1)
            ]
            
            todays_usage = ChemicalUsage.objects.filter(
                date_used__range=[
                    start_date.replace(hour=0, minute=0, second=0, microsecond=0),
                    end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                ]
            ).annotate(
                date=TruncDate('date_used', tzinfo=current_tz)
            ).values('date_used').annotate(
                count=Count('id')
            ).order_by('date_used')

            usage_count = {date: 0 for date in all_dates}
            for usage in todays_usage:
                if usage['date_used'] in usage_count:
                    usage_count[usage['date_used']] = usage['count']
                    
            todays_usage_details = [
                {
                    'day': date.strftime('%Y-%m-%d'), 
                    'count': usage_count[date]
                } 
                for date in all_dates
            ] 

            data = {
                'total_equipments': total_equipments,
                'total_chemicals': total_chemicals,
                'total_apparatus': total_apparatus,
                'todays_usage_details': todays_usage_details,
                'chemical_low_stocks': [
                    {
                        'id': chemical.id,
                        'name': chemical.name,
                        'description': chemical.description,
                        'unit': chemical.unit,
                        'volume_left': chemical.volume,
                        'reorder_level': chemical.reorder_level
                    } for chemical in chemical_low_stocks
                ],
                'chemical_recent_usage': [
                    {
                        'id': usage.id,
                        'name': usage.requested_chemical.chemical.name,
                        'unit': usage.requested_chemical.chemical.unit,
                        'inventory_number': usage.requested_chemical.inventory_number,
                        'volume_used': usage.quantity_used,
                        'date_used': usage.date_used.strftime('%Y-%m-%d'),
                    } for usage in chemical_recent_usage 
                ]
            }

            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
class BorrowTestEquipmentView(ListCreateAPIView):
    @transaction.atomic
    def post(self, request):
        user_barcode = request.data.get('userBarcode')
        equipment_barcodes = request.data.get('equipments', [])
        room_id = request.data.get('room_id')

        if not user_barcode or not equipment_barcodes or not room_id:
            return Response({'error': 'User barcode, equipment barcodes, and room ID are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            borrower = get_object_or_404(User, barcode_value=user_barcode)
            room = get_object_or_404(Room, id=room_id)

            borrow_date = timezone.now()
            borrow_records = []

            for equipment_barcode in equipment_barcodes:
                instance = EquipmentInstance.objects.select_for_update().get(barcode_value=equipment_barcode)

                if instance.is_borrowed:
                    return Response({'error': f'Equipment with barcode {equipment_barcode} is already borrowed'}, status=status.HTTP_400_BAD_REQUEST)

                instance.is_borrowed = True
                instance.borrowed_at = borrow_date
                instance.borrowed_by = borrower
                instance.current_location = room
                instance.save()

                borrow_record = EquipmentBorrowRecord.objects.create(
                    equipment_instance=instance,
                    borrower=borrower,
                    room=room,
                    borrow_date=borrow_date
                )
                borrow_records.append(borrow_record)

            serializer = EquipmentBorrowRecordSerializer(borrow_records, many=True)
            return Response({
                'message': 'Equipment borrowed successfully',
                'borrow_records': serializer.data
            }, status=status.HTTP_200_OK)

        except EquipmentInstance.DoesNotExist:
            return Response({'error': f'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReturnEquipmentInstanceView(ListCreateAPIView):
    @transaction.atomic
    def post(self, request, instance_id):
        if not request.user.is_secretary:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            instance = get_object_or_404(EquipmentInstance.objects.select_for_update(), id=instance_id)

            if not instance.is_borrowed:
                return Response({'error': 'Apparatus is not borrowed'}, status=status.HTTP_400_BAD_REQUEST)

            return_date = timezone.now()

            borrow_record = EquipmentBorrowRecord.objects.filter(
                equipment_instance=instance,
                return_date__isnull=True
            ).latest('borrow_date')

            borrow_record.return_date = return_date
            borrow_record.save()

            return_record = EquipmentReturnRecord.objects.create(
                equipment_instance=instance,
                borrow_record=borrow_record,
                return_date=return_date
            )

            instance.last_borrowed_by = instance.borrowed_by
            instance.last_borrowed_at = instance.borrowed_at
            instance.last_location = instance.current_location
            instance.current_location = None
            instance.is_borrowed = False
            instance.returned_at = return_date
            instance.borrowed_by = None
            instance.borrowed_at = None
            instance.save()

            borrow_serializer = EquipmentBorrowRecordSerializer(borrow_record)
            return_serializer = EquipmentReturnRecordSerializer(return_record)

            return Response({
                'message': 'Item returned successfully',
                'borrow_record': borrow_serializer.data,
                'return_record': return_serializer.data
            }, status=status.HTTP_200_OK)

        except EquipmentInstance.DoesNotExist:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)
        except EquipmentBorrowRecord.DoesNotExist:
            return Response({'error': 'Borrow record not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#kani error       
class SubjectListView(ListCreateAPIView):
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()

class UnitListView(ListCreateAPIView):
    serializer_class = UnitSerializer
    queryset = Unit.objects.all()

class LabCategoryView(APIView):
    def get(self, request):
        categories = LabCategory.objects.all()
        serializer = LabCategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = LabCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LabCategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        category = get_object_or_404(LabCategory, pk=pk)
        serializer = LabCategorySerializer(category)
        return Response(serializer.data)
    
    def put(self, request, pk):
        category = get_object_or_404(LabCategory, pk=pk)
        serializer = LabCategorySerializer(category, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        category = get_object_or_404(LabCategory, pk=pk)
        serializer = LabCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        category = get_object_or_404(LabCategory, pk=pk)
        category.delete()   
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class LabCategoryInstanceView(APIView):
    lookup_field = 'id'

    def get(self, request, pk):
        category = get_object_or_404(LabCategory, pk=pk)
        instances = EquipmentInstance.objects.filter(equipment__category=category)
        serializer = EquipmentInstanceSerializer(instances, many=True)
        return Response(serializer.data)
    

class SubjectDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        subject = get_object_or_404(Subject, pk=pk)    
        serializer = SubjectSerializer(subject)
        return Response(serializer.data)
    
    def put(self, request, pk):
        subject = get_object_or_404(Subject, pk=pk)
        serializer = SubjectSerializer(subject, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        subject = get_object_or_404(Subject, pk=pk)
        serializer = SubjectSerializer(subject, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        subject = get_object_or_404(Subject, pk=pk)
        subject.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AssignedEquipmentListView(ListCreateAPIView):
    queryset = EquipmentAssignmentRecord.objects.all()
    serializer_class = EquipmentAssignmentRecordSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_supply:
            return EquipmentAssignmentRecord.objects.all()
        else:
            return EquipmentAssignmentRecord.objects.none()
    
class DeanAssignedEquipmentListView(ListCreateAPIView):
    queryset = EquipmentAssignmentRecord.objects.all()
    serializer_class = EquipmentAssignmentRecordSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_dean or user.is_labtech:
            return EquipmentAssignmentRecord.objects.filter(assignee__is_dean=True)
        else:
            return EquipmentAssignmentRecord.objects.none()

class EquipmentView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentSerializer
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Equipment.objects.all()

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query) |
                Q(model__icontains=search_query) 
            )
        return queryset.order_by('name')
    

    
    def post(self, request):
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            equipment = serializer.save()

            quantity_to_add = int(request.data.get('quantity', 0))
            unit_cost = request.data.get('unit_cost')
            inventory_date = request.data.get('inventory_date')
            start_number = int(request.data.get('start_number', 1))
            suffix = request.data.get('suffix', "01")
            purchase_date = request.data.get('purchase_date')
            useful_life = request.data.get('useful_life')

            if quantity_to_add > 0 and inventory_date:
                instances = []
                for i in range(quantity_to_add):
                    current_number = str(start_number + i).zfill(4)  
                    inventory_number = f"{inventory_date}-{current_number}-{suffix}"
                    instance = EquipmentInstance.objects.create(
                        equipment=equipment,
                        inventory_number=inventory_number,
                        quantity=1,
                        unit_cost=unit_cost,
                        purchase_date=purchase_date,
                        useful_life=useful_life
                    )
                    instance.generate_barcode()  
                    instances.append(instance)
                    instance.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EquipmentDetailView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request, pk):
        equipment = get_object_or_404(Equipment, pk=pk)
        serializer = EquipmentSerializer(equipment)
        return Response(serializer.data)
    
    def put(self, request, pk):
        equipment = get_object_or_404(Equipment, pk=pk)
        serializer = EquipmentSerializer(equipment, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        equipment = get_object_or_404(Equipment, pk=pk)
        serializer = EquipmentSerializer(equipment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        equipment = get_object_or_404(Equipment, pk=pk)
        equipment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LatestEquipmentNumberView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        import re
        date_pattern = r'^\d{4}-\d{2}-\d{2}-\d+-\d+$'
        latest_instance = EquipmentInstance.objects.filter(
            inventory_number__regex=date_pattern
        ).order_by('-inventory_number').first()


        
        if latest_instance:
            try:
                # Extract the start number from inventory_number (YYYY-MM-DD-####-##)
                parts = latest_instance.inventory_number.split('-')
                if len(parts) >= 4:
                    # Make sure to strip leading zeros, if any
                    current_number = int(parts[3])
                    next_number = current_number + 1
                else:
                    current_number = 0
                    next_number = 1
            except (IndexError, ValueError):
                current_number = 0
                next_number = 1
        else:
            current_number = 0
            next_number = 1

        # Format the next number with leading zeros to make it 4 digits
        formatted_next_number = f"{next_number:04d}"

        return Response({
            'latest_start_number': current_number,
            'next_start_number': next_number,
            'formatted_next_number': formatted_next_number,
            'latest_inventory_number': latest_instance.inventory_number if latest_instance else None
        })



class AllEquipmentInstanceListView(ListCreateAPIView):
    serializer_class = EquipmentInstanceSerializer
    pagination_class = Pagination

    def get(self, request, pk):
        equipment = get_object_or_404(Equipment, pk=pk)
        instances = self.get_queryset()
        latest_start_number = equipment.get_latest_start_number()
        
        return Response({
            'instances': EquipmentInstanceSerializer(instances, many=True).data,
            'latest_start_number': latest_start_number + 1  # Add 1 for next available number
        })

    def get_queryset(self):
        queryset = EquipmentInstance.objects.all()

        search_query = self.request.query_params.get('search', '')
        category_id = self.request.query_params.get('category', '')
        value_filter = self.request.query_params.get('value_filter', '')
 
        if search_query:
            queryset = queryset.filter(
                Q(equipment__name__icontains=search_query) |
                Q(equipment__description__icontains=search_query) |
                Q(serial_number__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(current_condition__icontains=search_query) 
            )
        
        if category_id:
            queryset = queryset.filter(item__category_id=category_id)

        if value_filter:
            if value_filter.lower() == 'high':
                queryset = queryset.filter(unit_cost__gte=5000)
            elif value_filter.lower() == 'low':
                queryset = queryset.filter(unit_cost__lte=4999)

        return queryset
    
class EquipmentInstanceListView(ListAPIView):
    serializer_class = EquipmentInstanceSerializer
    pagination_class = Pagination
    
    def get_queryset(self):
        queryset = EquipmentInstance.objects.filter(
            equipment_id=self.kwargs['pk']
        ).annotate(
            has_borrower=Exists(
            EquipmentBorrowRecord.objects.filter(
                equipment_instance=OuterRef('pk'),
                returned_date__isnull=True
            )
            ),
            latest_borrow_date=Subquery(
            EquipmentBorrowRecord.objects.filter(
                equipment_instance=OuterRef('pk')
            ).order_by('-borrowed_date')
            .values('borrowed_date')[:1]
            )
        ).order_by('has_borrower', '-latest_borrow_date', 'id')
    
        search_query = self.request.query_params.get('search', '')

        if search_query:
            queryset = queryset.filter(
                Q(equipment__name__icontains=search_query) |
                Q(serial_number__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(current_condition__icontains=search_query) |
                Q(unit_cost__icontains=search_query) |
                Q(useful_life__icontains=search_query) |
                Q(equipmentborrowrecord__borrower__first_name__icontains=search_query) |
                Q(equipmentborrowrecord__borrower__last_name__icontains=search_query)
            )
        return queryset
    

    @transaction.atomic
    def post(self, request, pk):
        try:
            equipment = get_object_or_404(Equipment, pk=pk)
            quantity_to_add = int(request.data.get('quantity', 0))
            unit_cost = request.data.get('unit_cost')
            start_number = request.data.get('start_number')
            suffix = request.data.get('suffix', '01')
            inventory_date = request.data.get('inventory_date').split('T')[0] if 'T' in request.data.get('inventory_date', '') else request.data.get('inventory_date')

            if unit_cost is None or float(unit_cost) <= 0:
                return Response({"error": "Unit cost must be a positive value."}, status=status.HTTP_400_BAD_REQUEST)
            if quantity_to_add <= 0:
                return Response({"error": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
            if not start_number or not isinstance(start_number, (int, str)):
                return Response({"error": "Valid start number is required."}, 
                          status=status.HTTP_400_BAD_REQUEST)
            if not suffix or not isinstance(suffix, (int, str)):
                return Response({"error": "Valid suffix number is required."}, 
                          status=status.HTTP_400_BAD_REQUEST)

            instances = []
            start_num = int(start_number)

            for i in range(quantity_to_add):
                current_number = str(start_num + i).zfill(4)  
                inventory_number = f"{inventory_date}-{current_number}-{suffix}"

                instance = EquipmentInstance.objects.create(
                    equipment=equipment,
                    quantity=1,
                    unit_cost=unit_cost,
                    inventory_number=inventory_number,
                )
                instance.generate_barcode()
                instances.append(instance)
                instance.save()

            return Response(
                    EquipmentInstanceSerializer(instances, many=True).data,
                    status=status.HTTP_201_CREATED
                )
        except Equipment.DoesNotExist:
            return Response({"error": "Equipment not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid data format."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class EquipmentInstanceDetailView(generics.RetrieveAPIView):
    queryset = EquipmentInstance.objects.all()
    permission_classes = [IsAuthenticated,]
    serializer_class = EquipmentInstanceSerializer
    lookup_url_kwarg = 'instance_id'

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)  


class EquipmentBorrow(ListCreateAPIView):
    queryset = EquipmentBorrowRecord.objects.all()
    serializer_class = EquipmentBorrowRecordSerializer

    @transaction.atomic
    def post(self, request):
        user_id = request.data.get('user_id')
        custom_borrower = request.data.get('custom_borrower')
        subject_id = request.data.get('subject_id')
        room_id = request.data.get('room_id')
        equipment_ids = request.data.get('equipment_ids', [])
        purpose = request.data.get('purpose')

        if not user_id and not custom_borrower:
            return Response(
                {'error': "Either 'user_id' or 'custom_borrower' must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if user_id and custom_borrower:
            return Response(
                {'error': "'user_id' and 'custom_borrower' cannot both be set."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not room_id or not equipment_ids:
            return Response({'error': 'Room ID and Equipment IDs are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not subject_id:
            return Response({'error': 'Subject ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            borrower = None
            room = get_object_or_404(Room, id=room_id)
            subject = get_object_or_404(Subject, id=subject_id)

            
            if user_id: 
                borrower = get_object_or_404(User, id=user_id)
            borrow_records = []

            for equipment_id in equipment_ids:
                instance = EquipmentInstance.objects.select_for_update().get(id=equipment_id)

                if instance.get_current_borrower():
                    return Response({'error': f'Equipment {equipment_id} is already borrowed'}, status=status.HTTP_400_BAD_REQUEST)

                # Create a borrow record
                borrow_record = EquipmentBorrowRecord.objects.create(
                    equipment_instance=instance,
                    borrower=borrower, 
                    custom_borrower=custom_borrower,
                    subject=subject,
                    room=room,
                    purpose=purpose,
                    borrowed_date=timezone.now()
                )
                borrow_records.append(borrow_record)


            serializer = EquipmentBorrowRecordSerializer(borrow_records, many=True)
            return Response({'message': 'Equipment borrowed successfully', 'borrow_records': serializer.data}, status=status.HTTP_200_OK)

        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        except EquipmentInstance.DoesNotExist:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class EquipmentReturn(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, instance_id):
        instance = get_object_or_404(EquipmentInstance, id=instance_id)

        remarks = request.data.get('remarks', None)
        new_condition = request.data.get('new_condition', None)

        if not request.user.is_labtech:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            borrow_record = EquipmentBorrowRecord.objects.filter(
                equipment_instance=instance,
                returned_date__isnull=True
            ).latest('borrowed_date')
        except EquipmentBorrowRecord.DoesNotExist:
            return Response({'error': 'No active borrow record found'}, status=status.HTTP_404_NOT_FOUND)
        
        return_date = timezone.now()
        borrow_record.returned_date = return_date
        borrow_record.save()

        return_record = EquipmentReturnRecord.objects.create(
            equipment_instance=instance,
            borrow_record=borrow_record,
            remarks=remarks, 
            returned_date=return_date,
        )

        if new_condition in dict(EquipmentInstance.CONDITION_CHOICES).keys():
            instance.last_condition = instance.current_condition
            instance.current_condition = new_condition
        elif new_condition:
            return Response({'message': 'Invalid condition'}, status=status.HTTP_400_BAD_REQUEST)
        
        borrow_serializer = EquipmentBorrowRecordSerializer(borrow_record)
        return_serializer = EquipmentReturnRecordSerializer(return_record)

        return Response({
            'message': 'Equipment returned successfully',
            'borrow_record': borrow_serializer.data,
            'return_record': return_serializer.data
        }, status=status.HTTP_200_OK)
        

class EquipmentAssignment(ListCreateAPIView):
    @transaction.atomic
    def post(self, request):
        user_id = request.data.get('user_id')
        room_id = request.data.get('room_id')
        equipments_id = request.data.get('equipment_id', [])

        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not room_id:
            return Response({'error': 'Room ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not equipments_id:
            return Response({'error': 'Equipment ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignee = get_object_or_404(User, id=user_id)
            room = get_object_or_404(Room, id=room_id)
            assignment_records = []

            for equipment_id in equipments_id:
                instance = EquipmentInstance.objects.select_for_update().get(id=equipment_id)
                
                if instance.get_current_assignee():
                    return Response(
                        {'error': f'Equipment with ID {equipment_id} is already assigned'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                instance.status = 'Active'
                instance.save()


                assignment_record = EquipmentAssignmentRecord.objects.create(
                    equipment_instance=instance,
                    assignee=assignee,
                    assigned_location=room,
                    quantity=1,
                    assigned_date=timezone.now()
                )
                assignment_records.append(assignment_record)


            serializer = EquipmentAssignmentRecordSerializer(assignment_records, many=True)
            return Response({
                'message': 'Items assigned successfully',
                'assignment_records': serializer.data
            }, status=status.HTTP_200_OK)

        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        except EquipmentInstance.DoesNotExist:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BorrowEquipmentView(ListCreateAPIView):
    queryset = EquipmentBorrowRecord.objects.all()
    serializer_class = EquipmentBorrowRecordSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            # Save the new borrow record
            instance = serializer.save()

            # Borrow logic directly here
            equipment_instance = instance.equipment_instance

            # Verify current borrower and borrowed status (optional debug logs)
            print(f"Current Borrower: {equipment_instance.current_borrower()}")
            print(f"Is Currently Borrowed: {equipment_instance.is_currently_borrowed()}")

            # If this is a new borrow record and it hasn't been returned
            if not instance.returned_date:
                # Update instance status to Active
                equipment_instance.status = 'Active'

                # Update current location if a room is specified
                if instance.room:
                    # Track last location if current location changes
                    if equipment_instance.current_location and equipment_instance.current_location != instance.room:
                        equipment_instance.last_location = equipment_instance.current_location

                    # Update current location
                    equipment_instance.current_location = instance.room

                # Save the equipment instance
                equipment_instance.save()

class BorrowedEquipmentListView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentBorrowRecordSerializer

    def get_queryset(self):
        queryset = EquipmentBorrowRecord.objects.filter(returned_date__isnull=True).order_by('-borrowed_date')
        search_query = self.request.query_params.get('search', '')

        if search_query:
            queryset = queryset.filter(
                Q(equipment_instance__equipment__name__icontains=search_query) |
                Q(equipment_instance__inventory_number__icontains=search_query) |
                Q(borrower__first_name__icontains=search_query) |
                Q(borrower__last_name__icontains=search_query) |
                Q(subject__name__icontains=search_query) |
                Q(room__name__icontains=search_query)
            ).distinct()


        return queryset
    
class ChemicalUsageView(ListAPIView):
    serializer_class = ChemicalUsageSerializer
    permission_classes = [IsAuthenticated,]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = ChemicalUsage.objects.all().order_by('-date_used')  
        
        if self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(borrower=self.request.user)
        elif not (self.request.user.is_labtech or self.request.user.is_dean):
            queryset = queryset.none()
            
        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(requested_chemical__chemical__name__icontains=search_query) |
                Q(requested_chemical__inventory_number__icontains=search_query) |
                Q(quantity_used__icontains=search_query) |
                Q(borrower__username__icontains=search_query) |
                Q(room__name__icontains=search_query) |
                Q(subject__name__icontains=search_query )|
                Q(date_used__icontains=search_query)
            )
        
        return queryset
            


    
class ChemicalView(ListCreateAPIView):
    serializer_class = ChemicalSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):

        queryset = Chemical.objects.all().order_by('name')
        search_query = self.request.query_params.get('search', '')

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(unit__name__icontains=search_query) |
                Q(purchase_date__icontains=search_query) |
                Q(expiry_date__icontains=search_query)
            )
        return queryset.order_by('name')
    
class ChemicalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        chemical = get_object_or_404(Chemical, pk=pk)    
        serializer = ChemicalSerializer(chemical)
        return Response(serializer.data)
    
    def put(self, request, pk):
        chemical = get_object_or_404(Chemical, pk=pk)
        serializer = ChemicalSerializer(chemical, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        chemical = get_object_or_404(Chemical, pk=pk)
        serializer = ChemicalSerializer(chemical, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        chemical = get_object_or_404(Chemical, pk=pk)
        chemical.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class ChemicalStockView(ListAPIView):
    serializer_class = ChemicalStockSerializer

    def get_queryset(self):
        queryset = ChemicalStock.objects.filter(chemical_id=self.kwargs['pk'])
        search_query = self.request.query_params.get('search', '')

        if search_query:
            queryset = queryset.filter(
                Q(chemical__name__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(chemical__description__icontains=search_query) |
                Q(chemical__purchase_date__icontains=search_query) |
                Q(price__icontains=search_query) |
                Q(volume__icontains=search_query) |
                Q(expiry_date__icontains=search_query)
            )

        return queryset.order_by('-volume')
    
    @transaction.atomic
    def post(self, request, pk):
        try:
            chemical = get_object_or_404(Chemical, pk=pk)
            volume = int(request.data.get('volume', 0))
            price = request.data.get('price')
            purchase_date = request.data.get('purchase_date')
            expiry_date = request.data.get('expiry_date')

            if volume <= 0:
                return Response({"error": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
            if price is None or float(price) <= 0:
                return Response({"error": "Price must be a positive value."}, status=status.HTTP_400_BAD_REQUEST)
            if not expiry_date:
                return Response({"error": "Expiry date is required."}, status=status.HTTP_400_BAD_REQUEST)


            inventory_number = f"{uuid.uuid4().hex[:8].upper()}-{timezone.now().strftime('%Y-%m-%d')}"

            stock = ChemicalStock.objects.create(
                chemical=chemical,
                inventory_number=inventory_number,
                price=price,
                volume=volume,
                purchase_date=purchase_date,
                expiry_date=expiry_date
            )
            stock.generate_barcode()
            stock.save()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

            return Response(
                ChemicalStockSerializer(stock).data,
                status=status.HTTP_201_CREATED
            )
        except Chemical.DoesNotExist:
            return Response({"error": "Chemical not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid data format."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        
class ChemicalRequestView(ListCreateAPIView):

    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        room_id = request.data.get('room_id')
        subject_id = request.data.get('subject_id')
        purpose = request.data.get('purpose', '')
        chemical_requests = request.data.get('chemical_requests', [])

        if not user_id or not chemical_requests:
            return Response({
                'error': 'User ID and chemical requests are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = get_object_or_404(User, id=user_id)
            room = get_object_or_404(Room, id=room_id) if room_id else None
            subject = get_object_or_404(Subject, id=subject_id)

            date_used = timezone.now()
            usage_records = []

            for request_item in chemical_requests:
                chemical_stock_id = request_item['chemical_stock_id']  
                original_quantity = Decimal(str(request_item.get('original_quantity', 0)))
                request_unit = request_item.get('original_unit', None)

                chemical_stock = get_object_or_404(ChemicalStock, id=chemical_stock_id)

                if not request_unit:
                    request_unit = chemical_stock.chemical.unit

                if request_unit != chemical_stock.chemical.unit:
                    converted_quantity = self.convert_units(
                        original_quantity, 
                        request_unit, 
                        chemical_stock.chemical.unit
                    )
                    if converted_quantity is None:
                        return Response(
                            {'error': f'Cannot convert from {request_unit} to {chemical_stock.chemical.unit}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    quantity_to_deduct = converted_quantity
                else:
                    quantity_to_deduct = original_quantity

                if chemical_stock.volume < quantity_to_deduct:
                    return Response(
                        {'error': f'Insufficient volume for chemical assignment {chemical_stock}. '
                                  f'Requested: {quantity_to_deduct} {chemical_stock.chemical.unit}, '
                                  f'Available: {chemical_stock.volume} {chemical_stock.chemical.unit}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                usage_record = ChemicalUsage.objects.create(
                    requested_chemical=chemical_stock,
                    borrower=user,
                    room=room,
                    subject=subject,
                    purpose=purpose,
                    quantity_used=quantity_to_deduct,  # for deduction (converted)
                    quantity_requested=original_quantity,  # what the user inputted
                    request_unit=request_unit,
                    date_used=date_used
                )

                usage_records.append(usage_record)

            serializer = ChemicalUsageSerializer(usage_records, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Room.DoesNotExist:    
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        except Subject.DoesNotExist:    
            return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:    
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def convert_units(self, value, from_unit, to_unit):
        if from_unit == to_unit:
            return value

        volume_conversions = {
            'ml': Decimal('1'),
            'l': Decimal('1000'),
            'gal': Decimal('3785.41')
        }

        weight_conversions = {
            'g': Decimal('1'),
            'kg': Decimal('1000')
        }

        if from_unit in volume_conversions and to_unit in volume_conversions:
            value_in_ml = value * volume_conversions[from_unit]
            return value_in_ml / volume_conversions[to_unit]

        elif from_unit in weight_conversions and to_unit in weight_conversions:
            value_in_g = value * weight_conversions[from_unit]
            return value_in_g / weight_conversions[to_unit]

        return None


class ApparatusView(ListCreateAPIView):
    serializer_class = ApparatusSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Apparatus.objects.all().order_by('name')

        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query) |
                Q(apparatus_type__icontains=search_query)
            )

        return queryset
    
    def generate_unique_inventory_number(self, apparatus_name):
        # Sanitize apparatus name: remove special characters and truncate to 5 characters
        sanitized_name = re.sub(r'[^A-Za-z0-9]', '', apparatus_name)[:5].upper()
        
        while True:
            # Append UUID and current date
            inventory_number = f"{sanitized_name}-{uuid.uuid4().hex[:4].upper()}-{timezone.now().strftime('%Y-%m-%d')}"
            if not ApparatusInstance.objects.filter(inventory_number=inventory_number).exists():
                return inventory_number
    
    def post(self, request):
        serializer = ApparatusSerializer(data=request.data)
        if serializer.is_valid():
            apparatus = serializer.save()

            quantity_to_add = int(request.data.get('quantity', 0))
            unit_cost = request.data.get('unit_cost')
            purchase_date = request.data.get('purchase_date')

            if quantity_to_add > 0:
                instances = []

                if apparatus.apparatus_type == "Consumables":
                    inventory_number = self.generate_unique_inventory_number(apparatus.name)
                    instance = ApparatusInstance.objects.create(
                        apparatus=apparatus,
                        unit_cost=unit_cost or 0,
                        quantity=quantity_to_add,
                        inventory_number=inventory_number,
                        purchase_date=purchase_date,

                    )
                    instance.generate_barcode()
                    instances.append(instance)
                    instance.save()
                else:
                    for i in range(quantity_to_add):
                        inventory_number = self.generate_unique_inventory_number(apparatus.name)
                        instance = ApparatusInstance.objects.create(
                            apparatus=apparatus,
                            unit_cost=unit_cost or 0,
                            quantity=1,
                            inventory_number=inventory_number,
                            purchase_date=purchase_date,
                        )
                        instance.generate_barcode()
                        instances.append(instance)
                        instance.save()

                apparatus.quantity = sum(instance.quantity for instance in instances)
                apparatus.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ApparatusDetailView(APIView):
    def get(self, request, pk):
        apparatus = get_object_or_404(Apparatus, pk=pk)
        serializer = ApparatusSerializer(apparatus)
        return Response(serializer.data)
    
    def put(self, request, pk):
        apparatus = get_object_or_404(Apparatus, pk=pk)
        serializer = ApparatusSerializer(apparatus, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def patch(self, request, pk):
        apparatus = get_object_or_404(Apparatus, pk=pk)
        serializer = ApparatusSerializer(apparatus, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        apparatus = get_object_or_404(Apparatus, pk=pk)
        apparatus.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)  

class ApparatusInstanceView(ListCreateAPIView):
    serializer_class = ApparatusInstanceSerializer
    pagination_class = Pagination

    def get_queryset(self):
        queryset = ApparatusInstance.objects.filter(
            apparatus_id=self.kwargs['pk']
        ).annotate(
            has_borrower=Exists(
            ApparatusBorrowRecord.objects.filter(
                apparatus_instance=OuterRef('pk'),
                returned_date__isnull=True
            )
            ),
            latest_borrow_date=Subquery(
            ApparatusBorrowRecord.objects.filter(
                apparatus_instance=OuterRef('pk')
            ).order_by('-borrowed_date')
            .values('borrowed_date')[:1]
            )
        ).order_by('has_borrower', '-latest_borrow_date', 'id')

        search_query = self.request.query_params.get('search', '')

        if search_query:
            queryset = queryset.filter(
                Q(apparatus__name__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(current_condition__icontains=search_query) |
                Q(unit_cost__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(useful_life__icontains=search_query) |
                Q(apparatusborrowrecords__borrower__first_name__icontains=search_query) |
                Q(apparatusborrowrecords__borrower__last_name__icontains=search_query)
            )
        return queryset

    def generate_unique_inventory_number(self, apparatus_name):
        # Sanitize apparatus name: remove special characters and truncate to 5 characters
        sanitized_name = re.sub(r'[^A-Za-z0-9]', '', apparatus_name)[:5].upper()
        
        while True:
            # Append UUID and current date
            inventory_number = f"{sanitized_name}-{uuid.uuid4().hex[:4].upper()}-{timezone.now().strftime('%Y-%m-%d')}"
            if not ApparatusInstance.objects.filter(inventory_number=inventory_number).exists():
                return inventory_number
    
    @transaction.atomic
    def post(self, request, pk):
        try:
            apparatus = get_object_or_404(Apparatus, pk=pk)
            quantity_to_add = int(request.data.get('quantity', 0))
            unit_cost = request.data.get('unit_cost')
            useful_life = request.data.get('useful_life')
            purcahse_date = request.data.get('purchase_date')

            if quantity_to_add <= 0:
                return Response({"error": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
            if unit_cost is None or float(unit_cost) <= 0:
                return Response({"error": "Unit cost must be a positive value."}, status=status.HTTP_400_BAD_REQUEST)

            instances = []

            if apparatus.apparatus_type == 'Consumables':
                inventory_number = self.generate_unique_inventory_number(apparatus.name)

                instance = ApparatusInstance.objects.create(
                    apparatus=apparatus,
                    inventory_number=inventory_number,
                    unit_cost=unit_cost,
                    useful_life=useful_life,
                    quantity=quantity_to_add,
                    purchase_date=purcahse_date
                )
                instance.generate_barcode()
                instances = [instance]
            else:
                for _ in range(quantity_to_add):
                    inventory_number = self.generate_unique_inventory_number(apparatus.name)

                    instance = ApparatusInstance.objects.create(
                        apparatus=apparatus,
                        unit_cost=unit_cost,
                        quantity=1,
                        useful_life=useful_life,
                        inventory_number=inventory_number,
                        purchase_date=purcahse_date
                    )
                    instance.generate_barcode()
                    instances.append(instance)

            return Response(
                ApparatusInstanceSerializer(instances, many=True).data,
                status=status.HTTP_201_CREATED
            )        
        except Apparatus.DoesNotExist:
            return Response({"error": "Apparatus not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid data format."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class ApparatusInstanceDetailView(generics.RetrieveAPIView):
    queryset = ApparatusInstance.objects.all()
    permission_classes = [IsAuthenticated,]
    serializer_class = ApparatusInstanceSerializer
    lookup_url_kwarg = 'instance_id'

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApparatusBorrowView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user_id = request.data.get('user_id')
        custom_borrower = request.data.get('custom_borrower')
        room_id = request.data.get('room_id')
        subject_id = request.data.get('subject_id')
        apparatuses = request.data.get('apparatuses', []) 
        purpose = request.data.get('purpose')

        if not user_id and not custom_borrower:
            return Response({'error': "Either 'user_id' or 'custom_borrower' must be provided."}, status=status.HTTP_400_BAD_REQUEST)
        if user_id and custom_borrower:
            return Response({'error': "'user_id' and 'custom_borrower' cannot both be set."}, status=status.HTTP_400_BAD_REQUEST)
        if not apparatuses:
            return Response({'error': 'At least one apparatus ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not subject_id:
            return Response({'error': 'Subject ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            borrower = None
            room = get_object_or_404(Room, id=room_id)
            subject = get_object_or_404(Subject, id=subject_id)

            if user_id: 
                borrower = get_object_or_404(User, id=user_id)

            for apparatus in apparatuses:
                apparatus_id = apparatus.get('id')
                quantity = apparatus.get('quantity', 1)
                instance = ApparatusInstance.objects.select_for_update().get(id=apparatus_id)

                if instance.apparatus.apparatus_type == 'Consumables':
                    if instance.quantity < quantity:
                        return Response({'error': f'Not enough quantity of {instance.apparatus.name} available.'}, status=status.HTTP_400_BAD_REQUEST)

                    instance.quantity -= quantity
                    instance.save()

                    borrow_record = ApparatusBorrowRecord.objects.create(
                        apparatus_instance=instance,
                        quantity=quantity,
                        room=room,
                        subject=subject,
                        purpose=purpose,
                        custom_borrower=custom_borrower,
                        borrower=borrower,
                        returned_date=timezone.now()  # Set returned date immediately for consumables
                    )

                    # Create return record for consumables
                    ApparatusReturnRecord.objects.create(
                        apparatus_instance=instance,
                        borrow_record=borrow_record,
                        returned_date=timezone.now()
                    )

                else:
                    if instance.get_current_borrow_record():
                        return Response(
                            {'error': f'Apparatus with ID {instance.id} is already borrowed'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                borrow_record = ApparatusBorrowRecord.objects.create(
                    apparatus_instance=instance,
                    quantity=quantity,
                    room=room,
                    subject=subject,
                    purpose=purpose,
                    custom_borrower=custom_borrower,
                    borrower=borrower
                )

            return Response({'message': 'Apparatus borrowed successfully.'}, status=status.HTTP_201_CREATED)
        except ApparatusInstance.DoesNotExist:
            return Response({'error': 'Apparatus instance not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({'error': 'Invalid data format.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class ApparatusBorrowListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ApparatusBorrowRecordSerializer

    def get_queryset(self):
        queryset = ApparatusBorrowRecord.objects.filter(borrowed_date__lte=timezone.now(), returned_date__isnull=True).order_by('-borrowed_date')
        if self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(borrower=self.request.user)

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(apparatus_instance__apparatus__name__icontains=search_query) |
                Q(subject__name__icontains=search_query) |
                Q(custom_borrower__icontains=search_query) |
                Q(borrower__first_name__icontains=search_query) |
                Q(borrower__last_name__icontains=search_query)
            )

        return queryset
    
class ApparatusReturnListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ApparatusReturnRecordSerializer

    def get_queryset(self):
        queryset = ApparatusReturnRecord.objects.filter(returned_date__lte=timezone.now()).order_by('-returned_date')

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(apparatus_instance__apparatus__name__icontains=search_query) |
                Q(borrow_record__subject__name__icontains=search_query) |
                Q(borrow_record__custom_borrower__icontains=search_query) |
                Q(borrow_record__room__name__icontains=search_query) |
                Q(borrow_record__borrower__first_name__icontains=search_query) |
                Q(borrow_record__borrower__last_name__icontains=search_query) 
            )

        return queryset
    
class DistributedApparatusListView(ListAPIView):
    permission_classes  = [IsAuthenticated]
    serializer_class = ApparatusReturnRecordSerializer

    def get_queryset(self):
        queryset = ApparatusReturnRecord.objects.filter(returned_date__lte=timezone.now()).order_by('-returned_date')

        if self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(borrow_record__borrower=self.request.user)
        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(apparatus_instance__apparatus__name__icontains=search_query) |
                Q(borrow_record__subject__name__icontains=search_query) |
                Q(borrow_record__custom_borrower__icontains=search_query) |
                Q(borrow_record__room__name__icontains=search_query) |
                Q(borrow_record__borrower__first_name__icontains=search_query) |
                Q(borrow_record__borrower__last_name__icontains=search_query) 
            )

        return queryset

class ApparatusReturnView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, instance_id):
        instance = get_object_or_404(ApparatusInstance, id=instance_id)

        remarks = request.data.get('remarks')
        new_condition = request.data.get('condition', '')

        if not request.user.is_labtech:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        if instance.apparatus.apparatus_type == 'Consumables':
            return Response({'error': 'Cannot return consumable items.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            borrow_record = ApparatusBorrowRecord.objects.filter(
                apparatus_instance=instance, 
                returned_date__isnull=True
            ).latest('borrowed_date')
        except ApparatusBorrowRecord.DoesNotExist:
            return Response({'error': 'Apparatus not borrowed.'}, status=status.HTTP_404_NOT_FOUND)

        returned_date = timezone.now()

        borrow_record.returned_date = returned_date
        borrow_record.remarks = remarks
        borrow_record.save()

        return_record = ApparatusReturnRecord.objects.create(
            apparatus_instance=instance,
            borrow_record=borrow_record,
            remarks=remarks,
            returned_date=returned_date
        )

        if new_condition in dict(ApparatusInstance.CONDITION_CHOICES).keys():
            instance.last_condition = instance.current_condition
            instance.current_condition = new_condition
            instance.save()

        elif new_condition:
            return Response({'message': 'Invalid condition'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Apparatus returned successfully.'}, status=status.HTTP_201_CREATED)
    
class EquipmentReturnView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, instance_id):
        instance = get_object_or_404(EquipmentInstance, id=instance_id)

        remarks = request.data.get('remarks')
        new_condition = request.data.get('condition', '')

        if not request.user.is_labtech:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        

        try:
            borrow_record = EquipmentBorrowRecord.objects.filter(
                equipment_instance=instance, 
                returned_date__isnull=True
            ).latest('borrowed_date')
        except EquipmentBorrowRecord.DoesNotExist:
            return Response({'error': 'Equipment not borrowed.'}, status=status.HTTP_404_NOT_FOUND)

        returned_date = timezone.now()

        borrow_record.returned_date = returned_date
        borrow_record.remarks = remarks
        borrow_record.save()

        return_record = EquipmentReturnRecord.objects.create(
            equipment_instance=instance,
            borrow_record=borrow_record,
            remarks=remarks,
            returned_date=returned_date
        )

        if new_condition in dict(EquipmentInstance.CONDITION_CHOICES).keys():
            instance.last_condition = instance.current_condition
            instance.current_condition = new_condition
            instance.save()

        elif new_condition:
            return Response({'message': 'Invalid condition'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Apparatus returned successfully.'}, status=status.HTTP_201_CREATED) 

class EquipmentReturnListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentReturnRecordSerializer

    def get_queryset(self):
        queryset =  EquipmentReturnRecord.objects.filter(returned_date__lte=timezone.now()).order_by('-returned_date')

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(equipment_instance__equipment__name__icontains=search_query) |
                Q(borrow_record__subject__name__icontains=search_query) |
                Q(borrow_record__custom_borrower__icontains=search_query) |
                Q(borrow_record__equipment_instance__equipment__name__icontains=search_query) |
                Q(borrow_record__equipment_instance__inventory_number__icontains=search_query) |
                Q(borrow_record__room__name__icontains=search_query) |
                Q(borrow_record__borrower__first_name__icontains=search_query) |
                Q(borrow_record__borrower__last_name__icontains=search_query) 
            )

        return queryset