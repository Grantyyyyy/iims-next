from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Case, When, Value, IntegerField, F
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count
from secretary.models import Category, ItemInstance, Item
from secretary.serializers import ItemInstanceSerializer
from labtech.models import Equipment, EquipmentAssignmentRecord, Subject
from secretary.models import BorrowRecord
from staff.models import TransferRequest, DisposeRequest, ReplaceRequest
from .models import ChemicalAssignment
from users.models import Room, User

from .serializers import CategorySerializer, CategoryInstanceSerializer, ChemicalAssignmentSerializer


# class DashboardView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             transfered_items = TransferRequest.objects.filter(
#                 status='APPROVED'
#             ).count()
#             assigned_equipment = EquipmentAssignmentRecord.objects.filter(
#                 unassigned_date__isnull=True
#             ).count()
#             assigned_chemicals = ChemicalAssignment.objects.order_by('-processed_date')[:5]
#             lastest_assigned_equipment = EquipmentAssignmentRecord.objects.order_by('-assigned_date')[:5]

#             transfer_approval = TransferRequest.objects.filter(
#                 status='PENDING'
#             )

#             most_used_chemicals = ChemicalUsage.objects.filter(
#                 date_used__year=timezone.now().year,
#                 date_used__month=timezone.now().month
#             ).order_by('-quantity_used')[:5]
            
#             total_items = Item.objects.count()
#             total_equipment = Equipment.objects.count()
#             total_chemicals = Chemical.objects.count()

#             data = {
#                 'most_used_chemicals': [
#                     {
#                         'chemical_name': chemical.requested_chemical.chemical_stock.chemical.name,
#                         'quantity_used': chemical.quantity_used,
#                         'unit': chemical.requested_chemical.chemical_stock.chemical.unit,
#                         'date_used': chemical.date_used,
#                     }
#                     for chemical in most_used_chemicals

#                 ],
#                 'transfered_items': transfered_items,
#                 'assigned_items': assigned_items,
#                 'assigned_equipment': assigned_equipment,
#                 'assigned_chemicals': [
#                     {
#                         'chemical_stock_id': chemical.chemical_stock.id,
#                         'chemical_name': chemical.chemical_stock.chemical.name,
#                         'assignee': chemical.assignee.first_name + ' ' + chemical.assignee.last_name,
#                         'assigned_volume': chemical.assigned_volume,
#                         'remaining_volume': chemical.remaining_volume,
#                         'processed_date': chemical.processed_date
#                     }
#                     for chemical in assigned_chemicals
#                 ],
#                 'lastest_assigned_equipment': [
#                     {
#                         'equipment_id': equipment.equipment_instance.id,
#                         'equipment_name': equipment.equipment_instance.equipment.name,
#                         'assignee': equipment.assignee.first_name + ' ' + equipment.assignee.last_name,
#                         'assigned_location': equipment.assigned_location.name,
#                         'assigned_date': equipment.assigned_date
#                     }
#                     for equipment in lastest_assigned_equipment
#                 ],
#                 'total_items': total_items,
#                 'total_equipment': total_equipment,
#                 'total_chemicals': total_chemicals,
#                 'transfer_approval': [
#                     {
#                         'transfer_id': transfer.id,
#                         'item_name': transfer.item_instance.item.name,
#                         'requested_by': transfer.requested_by.first_name + ' ' + transfer.requested_by.last_name,
#                         'requested_date': transfer.requested_date,
#                         'new_assignee': transfer.new_assignee.first_name + ' ' + transfer.new_assignee.last_name,
#                         'new_location': transfer.new_location.name,
                        
#                     }
#                     for transfer in transfer_approval
#                 ]
#             }

#             return Response(data, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class CategoryInstanceDetailView(APIView):
    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        instances = ItemInstance.objects.filter(item__category=category)
        serializer = CategoryInstanceSerializer(instances, many=True)
        return Response(serializer.data)
    
    def put(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)  
    

class CategoryView(APIView):
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class CategoryDetailView(APIView):
    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category)
        return Response(serializer.data)
    
    def put(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)  
    

class CategoryInstanceView(APIView):
    lookup_field = 'id'

    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        instances = ItemInstance.objects.filter(item__category=category)
        serializer = CategoryInstanceSerializer(instances, many=True)
        return Response(serializer.data)
    

class AssignedChemicalView(ListAPIView):
    serializer_class = ChemicalAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_dean or user.is_labtech:
            return ChemicalAssignment.objects.filter(assignee__is_dean=True).order_by('-remaining_volume')
        elif user.is_supply:
            return ChemicalAssignment.objects.all()
        else:
            return ChemicalAssignment.objects.none()



class ChemicalAssignmentView(ListCreateAPIView):
    @transaction.atomic
    def post(self, request):
        user_id = request.data.get('user_id')
        room_id = request.data.get('room_id')
        chemical_assignments = request.data.get('chemical_assignments', [])

        # Validate required fields
        if not user_id or not chemical_assignments:
            return Response({
                'error': 'User ID and Chemical Assignments are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Fetch user
            user = get_object_or_404(User, id=user_id)
            room = get_object_or_404(Room, id=room_id) if room_id else None

            # Prepare to store assignment records
            assignment_records = []

            # Process each chemical assignment
            for assignment_data in chemical_assignments:
                chemical_stock_id = assignment_data.get('chemical_stock_id')
                assigned_volume = assignment_data.get('assigned_volume')

                # Validate individual assignment data
                if not all([chemical_stock_id, assigned_volume]):
                    return Response({
                        'error': 'Each assignment must have a chemical stock ID and assigned volume'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Fetch chemical stock
                chemical_stock = get_object_or_404(ChemicalStock, id=chemical_stock_id)

                # Convert assigned volume to Decimal
                assigned_volume = Decimal(str(assigned_volume))

                # Validate assigned volume against available stock
                if assigned_volume > chemical_stock.volume:
                    return Response({
                        'error': f'Assigned volume exceeds available stock volume for chemical stock {chemical_stock_id}'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Create assignment
                assignment = ChemicalAssignment.objects.create(
                    assignee=user,
                    room=room,
                    chemical_stock=chemical_stock,
                    assigned_volume=assigned_volume,
                    processed_by=request.user,
                    processed_date=timezone.now()
                )

                assignment_records.append(assignment)

            # Serialize all assignments
            serializer = ChemicalAssignmentSerializer(assignment_records, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        except ChemicalStock.DoesNotExist:
            return Response({'error': 'Chemical stock not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class ChemicalRequestView(ListCreateAPIView):

#     def post(self, request, *args, **kwargs):
#         user_id = request.data.get('user_id')
#         room_id = request.data.get('room_id')

#         purpose = request.data.get('purpose', '') 
#         chemical_requests = request.data.get('chemical_requests', [])

#         if not user_id or not chemical_requests:
#             return Response({
#                 'error': 'User ID and chemical requests are required'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             # Fetch the user and room data
#             user = get_object_or_404(User, id=user_id)
#             room = get_object_or_404(Room, id=room_id) if room_id else None
#             subject = get_object_or_404(Subject, id=subject_id) if subject_id else None
#             date_used = timezone.now()
#             usage_records = []

#             for request_item in chemical_requests:
#                 chemical_stock_id = request_item['chemical_stock_id']  
#                 quantity = Decimal(str(request_item['quantity_requested']))

#                 # Find the ChemicalAssignment based on ID
#                 requested_chemical = get_object_or_404(ChemicalStock, id=chemical_stock_id)

#                 # Check if there is enough remaining volume in the assignment
#                 if requested_chemical.remaining_volume < quantity:
#                     return Response(
#                         {'error': f'Insufficient volume for chemical assignment {requested_chemical}. '
#                                   f'Requested: {quantity}, Available: {requested_chemical.remaining_volume}'},
#                         status=status.HTTP_400_BAD_REQUEST
#                     )

#                 requested_chemical.save(update_fields=["remaining_volume"])  

#                 usage_record = ChemicalUsage.objects.create(
#                     requested_chemical=requested_chemical,
#                     borrower=user,
#                     room=room,
#                     purpose=purpose,
#                     quantity_used=quantity,
#                     date_used=date_used
#                 )
#                 usage_records.append(usage_record)

#             # Serialize and return the usage records
#             serializer = ChemicalUsageSerializer(usage_records, many=True)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)

#         except User.DoesNotExist:
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
#         except Room.DoesNotExist:    
#             return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:    
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
