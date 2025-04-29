from django.db.models import Q
from django.db import transaction
from .models import Status, DisposeRequest, TransferRequest, ReplaceRequest
from .serializers import StatusSerializer, DisposeRequestSerializer, TransferRequestSerializer, ReplaceRequestSerializer

from secretary.models import ItemInstance, BorrowRecord
from secretary.serializers import ItemInstanceSerializer
from users.models import Room

from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from django.forms import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone

from django.contrib.auth import get_user_model

User = get_user_model()


class Pagination(PageNumberPagination):
    page_size = 10  
    page_size_query_param = 'page_size'
    max_page_size = 100



class Dashboard(ListAPIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        try:
            transfer_items = TransferRequest.objects.filter(
                requested_by=self.request.user
            ).count()

            dispose_items = DisposeRequest.objects.filter(
                requested_by=self.request.user
            ).count()

            replace_items = ReplaceRequest.objects.filter(
                requested_by=self.request.user
            ).count()
            current_borrowed = BorrowRecord.objects.filter(
                borrower=self.request.user,
                return_date__isnull=True
            )

            data = {
                'transfer_items': transfer_items,
                'dispose_items': dispose_items,
                'replace_items': replace_items,
                'current_borrowed': current_borrowed
            }

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class TransferPendingRequestView(APIView):
#     permission_classes = (IsAuthenticated,)

#     def get(self, request):
#         pending_transfers = TransferRequest.objects.filter(
#             status='PENDING'
#         ).select_related('item_instance').order_by('-requested_date')
        
#         serializer = TransferRequestSerializer(pending_transfers, many=True)
#         return Response(serializer.data)
    
# class DisposePendingRequestView(APIView):
#     permission_classes = (IsAuthenticated,)

#     def get(self, request):
#         pending_disposes = DisposeRequest.objects.filter(
#             status='PENDING'
#         ).select_related('item_instance')
        
#         serializer = DisposeRequestSerializer(pending_disposes, many=True)
#         return Response(serializer.data)
    
# class ReplacePendingRequestView(APIView):
#     permission_classes = (IsAuthenticated,)

#     def get(self, request):
#         pending_replaces = ReplaceRequest.objects.filter(
#             status='PENDING'
#         ).select_related('item_instance')
        
#         serializer = ReplaceRequestSerializer(pending_replaces, many=True)
#         return Response(serializer.data)

# class TransferListView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = TransferRequestSerializer

#     def get(self, request):
#         # Restrict access to supply or staff users only
#         if not request.user.is_supply and not request.user.is_staff:
#             return Response(
#                 {'error': 'Only staff users can view transfer requests.'},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         if request.user.is_supply:
#             transfer_requests = TransferRequest.objects.filter(
#                 Q(status='PENDING') | Q(status='APPROVED')
#             ).order_by('-status')
#         else:
#             transfer_requests = TransferRequest.objects.filter(
#                 requested_by=request.user
#             )
        
#         serializer = self.serializer_class(transfer_requests, many=True)
#         return Response(serializer.data)

# class AssigneeTransferRequestListView(APIView):
#     permission_classes = (IsAuthenticated,)
    
#     def get(self, request):
#         transfer_requests = TransferRequest.objects.filter(
#             new_assignee=request.user,
#             status='AWAITING_ASSIGNEE_CONFIRMATION'
#         )
#         serializer = TransferRequestSerializer(transfer_requests, many=True)
#         return Response(serializer.data)

# class DisposeListView(APIView):
#     permission_classes = (IsAuthenticated,)  
#     serializer_class = DisposeRequestSerializer

#     def get(self, request):
#         # Restrict access to supply or staff users only
#         if not request.user.is_supply and not request.user.is_staff:
#             return Response(
#                 {'error': 'Only staff users can view dispose requests.'},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         if request.user.is_supply:
#             dispose_requests = DisposeRequest.objects.all()
#         else:
#             dispose_requests = DisposeRequest.objects.filter(
#             requested_by=request.user
#         )
       
        
#         serializer = self.serializer_class(dispose_requests, many=True)
#         return Response(serializer.data)
    
# class ReplaceListView(APIView):
#     permission_classes = (IsAuthenticated,)  # Fix: Changed 'permission_class' to 'permission_classes'
#     serializer_class = ReplaceRequestSerializer

#     def get(self, request):
#         # Restrict access to supply or staff users only
#         if not request.user.is_supply and not request.user.is_staff:
#             return Response(
#                 {'error': 'Only staff users can view replace requests.'},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         if request.user.is_supply:
#             replace_requests = ReplaceRequest.objects.all()
#         else:
#             replace_requests = ReplaceRequest.objects.filter(
#             requested_by=request.user
#         )
       
        
#         serializer = self.serializer_class(replace_requests, many=True)
#         return Response(serializer.data)


# class TransferRequestCreateView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = TransferRequestSerializer

#     @transaction.atomic
#     def post(self, request, *args, **kwargs):
#         if not request.user.is_staff:
#             return Response(
#                 {'error': 'Only staff users can create transfer requests.'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         item_ids = request.data.get('item', [])
#         user_id = request.data.get('user_id')
#         room_id = request.data.get('room_id')
#         reason = request.data.get('transfer_reason')

#         existing_request = TransferRequest.objects.filter(
#             item_instance_id__in=item_ids,
#             status=['PENDING', 'AWAITING_ASSIGNEE_CONFIRMATION']
#         ).exists()

#         if existing_request:
#             return Response(
#                 {'error': 'A transfer request is already pending for one or more of the selected items.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             new_assignee = get_object_or_404(User, id=user_id)
#             new_location = get_object_or_404(Room, id=room_id)
            
#             transfer_requests = []


            
#             for item_id in item_ids:
#                 instance = ItemInstance.objects.select_for_update().get(id=item_id)

#                 transfer_request = TransferRequest.objects.create(
#                     item_instance=instance,
#                     requested_by=request.user,
#                     new_assignee=new_assignee,
#                     new_location=new_location,
#                     transfer_reason=reason,
#                     status='AWAITING_ASSIGNEE_CONFIRMATION'
#                 )
#                 transfer_requests.append(transfer_request)

#             serializer = TransferRequestSerializer(transfer_requests, many=True)
            
#             return Response({
#                 'message': 'Transfer requests created successfully.',
#                 'transfer_requests': serializer.data
#             }, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# class TransferConfirmationView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = TransferRequestSerializer

#     @transaction.atomic
#     def post(self, request, pk, *args, **kwargs):
#         try:
#             transfer_request = get_object_or_404(TransferRequest, pk=pk)
#             action = request.data.get('action', '').upper()

#             if transfer_request.status != 'AWAITING_ASSIGNEE_CONFIRMATION':
#                 return Response(
#                     {'error': 'This transfer request is not awaiting assignee confirmation.'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             if request.user != transfer_request.new_assignee:
#                 return Response(
#                     {'error': 'Only the requested new assignee can confirm this transfer.'}, 
#                     status=status.HTTP_403_FORBIDDEN
#                 )

#             if action not in ['CONFIRMED', 'REJECTED']:
#                 return Response(
#                     {'error': 'Invalid action. Must be either CONFIRMED or REJECTED.'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             if action == 'REJECTED':
#                 transfer_request.status = 'ASSIGNEE_REJECTED'
#                 transfer_request.save()
#                 return Response({
#                     'message': 'Transfer request rejected by assignee.',
#                     'transfer_request': TransferRequestSerializer(transfer_request).data
#                 }, status=status.HTTP_200_OK)

#             if action == 'CONFIRMED':
#                 transfer_request.status = 'PENDING'
#                 transfer_request.save()
#                 return Response({
#                     'message': 'Transfer request confirmed by assignee, awaiting supply approval.',
#                     'transfer_request': TransferRequestSerializer(transfer_request).data
#                 }, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# class TransferApprovalView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = TransferRequestSerializer

#     @transaction.atomic
#     def post(self, request, pk, *args, **kwargs):
#         try:
#             transfer_request = get_object_or_404(TransferRequest, pk=pk)
#             action = request.data.get('action', '').upper()

#             # Validate action
#             if action not in ['APPROVED', 'REJECTED']:
#                 return Response(
#                     {'error': 'Invalid action. Must be either APPROVED or REJECTED.'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             if transfer_request.status != 'PENDING':
#                 return Response(
#                     {'error': f'Transfer request is already {transfer_request.status.lower()}'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             transfer_request.status = action
#             transfer_request.processed_by = request.user
#             transfer_request.processed_date = timezone.now()

#             assign_record = None
#             if action == 'APPROVED':
#                 item_instance = transfer_request.item_instance
                
#                 current_assignment = AssignRecord.objects.filter(
#                     item_instance=item_instance,
#                     unassigned_date__isnull=True
#                 ).first()
                
#                 if current_assignment:
#                     current_assignment.unassigned_date = timezone.now()
#                     current_assignment.save(update_fields=['unassigned_date'])

#                 assignee = transfer_request.new_assignee
#                 current_assignee = item_instance.assignee

#                 # Create new AssignRecord
#                 assign_record = AssignRecord.objects.create(
#                     item_instance=item_instance,
#                     assignee=assignee,
#                     room=transfer_request.new_location,
#                 )

#                 item_instance.status = 'Active'
#                 item_instance.assignee = assignee
#                 item_instance.last_assignee = current_assignee
#                 item_instance.last_assigned_at = timezone.now()
#                 item_instance.last_location = transfer_request.new_location
#                 item_instance.save(update_fields=[
#                     'status', 
#                     'last_assignee',
#                     'assignee', 
#                     'last_assigned_at', 
#                     'last_location'
#                 ])
            
#             transfer_request.save()

#             assign_serializer = AssignRecordSerializer(assign_record) if assign_record else None
#             serializer = TransferRequestSerializer(transfer_request)
            
#             return Response({
#                 'message': f'Transfer request {action.lower()}d successfully.',
#                 'transfer_request': serializer.data,
#                 'assign_record': assign_serializer.data if assign_serializer else None
#             }, status=status.HTTP_200_OK)

#         except TransferRequest.DoesNotExist:
#             return Response(
#                 {'error': 'Transfer request not found'}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

#     def get(self, request):
#         """Get all pending transfer requests"""
#         transfer_requests = TransferRequest.objects.filter(status='PENDING')
#         serializer = TransferRequestSerializer(transfer_requests, many=True)
#         return Response(serializer.data)

# class DisposeRequestCreateView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = DisposeRequestSerializer

#     @transaction.atomic
#     def post(self, request, *args, **kwargs):
#         if not request.user.is_staff:
#             return Response(
#                 {'error': 'Only staff users can create dispose requests.'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         item_ids = request.data.get('item', [])
#         reason = request.data.get('disposal_reason')

#         existing_request = DisposeRequest.objects.filter(
#             item_instance_id__in=item_ids,
#             status='PENDING'
#         ).exists()

#         if existing_request:
#             return Response(
#                 {'error': 'A dispose request is already pending for one or more of the selected items.'},
#                 status=status.HTTP_400_BAD_REQUEST
#         )
#         try:
            
#             for item_id in item_ids:
#                 instance = ItemInstance.objects.select_for_update().get(id=item_id)

#                 dispose_request = DisposeRequest.objects.create(
#                     item_instance=instance,
#                     requested_by=request.user,
#                     disposal_reason=reason,
#                     status='PENDING'
#                 )

#             serializer = DisposeRequestSerializer(dispose_request)
            
#             return Response({
#                 'message': 'Dispose request created successfully.',
#                 'dispose_request': serializer.data
#             })

#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
# class DisposeApprovalView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = DisposeRequestSerializer

#     @transaction.atomic
#     def post(self, request, pk, *args, **kwargs):
#         try:
#             dispose_request = get_object_or_404(DisposeRequest, pk=pk)
#             action = request.data.get('action', '').upper()

#             # Validate action
#             if action not in ['APPROVED', 'REJECT']:
#                 return Response(
#                     {'error': 'Invalid action. Must be either APPROVED or REJECT'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Check if request is already processed
#             if dispose_request.status != 'PENDING':
#                 return Response(
#                     {'error': f'Dispose request is already {dispose_request.status.lower()}'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Update dispose request
#             dispose_request.status = action
#             dispose_request.processed_by = request.user
#             dispose_request.processed_date = timezone.now()
#             dispose_request.save()

#             if action == 'APPROVED':
#                 item_instance = dispose_request.item_instance
#                 item_instance.status = 'Inactive'
#                 item_instance.assignee = None
#                 item_instance.assigned_at = None
#                 item_instance.save()

#             serializer = DisposeRequestSerializer(dispose_request)
            
#             return Response({
#                 'message': f'Dispose request {action.lower()}d successfully.',
#                 'dispose_request': serializer.data
#             }, status=status.HTTP_200_OK)

#         except DisposeRequest.DoesNotExist:
#             return Response(
#                 {'error': 'Dispose request not found'}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

#     def get(self, request):
#         """Get all pending dispose requests"""
#         dispose_requests = DisposeRequest.objects.filter(status='PENDING')
#         serializer = DisposeRequestSerializer(dispose_requests, many=True)
#         return Response({
#             'dispose_requests': serializer.data
#             })
    

# class ReplaceRequestCreateView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = ReplaceRequestSerializer


#     @transaction.atomic
#     def post(self, request, *args, **kwargs):
#         if not request.user.is_staff:
#             return Response(
#                 {'error': 'Only staff users can create replace requests.'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         item_ids = request.data.get('item', [])
#         reason = request.data.get('replacement_reason')
#         try:
            
#             for item_id in item_ids:
#                 instance = ItemInstance.objects.select_for_update().get(id=item_id)

#                 replace_request = ReplaceRequest.objects.create(
#                     item_instance=instance,
#                     requested_by=request.user,
#                     replacement_reason=reason,
#                     status='PENDING'

#                 )

#             serializer = ReplaceRequestSerializer(replace_request)
            
#             return Response({
#                 'message': 'Replace request created successfully.',
#                 'replace_request': serializer.data
#             })

#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# class ReplaceApprovalView(APIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = ReplaceRequestSerializer

#     @transaction.atomic
#     def post(self, request, pk, *args, **kwargs):
#         try:
#             replace_request = get_object_or_404(ReplaceRequest, pk=pk)
#             action = request.data.get('action', '').upper()
#             replacement_item_id = request.data.get('replacement_item_id')

#             # Validate action
#             if action not in ['APPROVED', 'REJECT']:
#                 return Response(
#                     {'error': 'Invalid action. Must be either APPROVED or REJECT'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Check if request is already processed
#             if replace_request.status != 'PENDING':
#                 return Response(
#                     {'error': f'Replace request is already {replace_request.status.lower()}'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # For approvals, require a replacement item
#             if action == 'APPROVED':
#                 if not replacement_item_id:
#                     return Response(
#                         {'error': 'Replacement item must be selected for approval'},
#                         status=status.HTTP_400_BAD_REQUEST
#                     )

#                 # Get and validate replacement item
#                 try:
#                     replacement_item = ItemInstance.objects.get(id=replacement_item_id)
#                     if replacement_item.status != 'Inactive' or replacement_item.assignee or replacement_item.is_borrowed:
#                         return Response(
#                             {'error': 'Selected replacement item is not available'},
#                             status=status.HTTP_400_BAD_REQUEST
#                         )
#                 except ItemInstance.DoesNotExist:
#                     return Response(
#                         {'error': 'Replacement item not found'},
#                         status=status.HTTP_404_NOT_FOUND
#                     )
                
#                 assignee = replace_request.item_instance.assignee
                
#                 assign_record = AssignRecord.objects.create(
#                     item_instance=replacement_item,
#                     assignee=assignee,
#                     room=replace_request.item_instance.assigned_at,
#                     assigned_date=timezone.now()
#                 )

#                 serializer = AssignRecordSerializer(assign_record)

#                 # Update the replacement item
#                 replacement_item.assignee = replace_request.item_instance.assignee
#                 replacement_item.assigned_date = timezone.now()
#                 replacement_item.assigned_at = replace_request.item_instance.assigned_at
#                 replacement_item.status = 'Active'  
#                 replacement_item.save()

#                 # Update replace request
#                 replace_request.status = action
#                 replace_request.processed_by = request.user
#                 replace_request.processed_date = timezone.now()
#                 replace_request.replacement_item = replacement_item  
#                 replace_request.save()

#                 # Update original item status
#                 item_instance = replace_request.item_instance
#                 item_instance.status = 'Inactive'
#                 item_instance.assignee = None
#                 item_instance.assigned_at = None
#                 item_instance.save()


#                 return Response({
#                     'message': f'Replace request {action.lower()}d successfully.',
#                     'replace_request': serializer.data
#                 })

#             else:  # REJECT case
#                 replace_request.status = action
#                 replace_request.processed_by = request.user
#                 replace_request.processed_date = timezone.now()
#                 replace_request.save()

#             serializer = ReplaceRequestSerializer(replace_request)

#             return Response({
#                 'message': f'Replace request {action.lower()}d successfully.',
#                 'replace_request': serializer.data
#             }, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class AvailableInstancesView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ItemInstanceSerializer
    pagination = Pagination

    def get_queryset(self):
        queryset = ItemInstance.objects.filter(
            status='Inactive',
            assignee__isnull=True,
        )
        category_id = self.request.query_params.get('category_id')
        if category_id:
            # Use item__category to filter through the related Item model
            queryset = queryset.filter(item__category_id=category_id)
        return queryset

        





