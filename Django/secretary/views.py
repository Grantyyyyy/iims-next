from decimal import Decimal
import re
import random, string, uuid

from django.db.models import Count, Q, Sum, F, Exists, OuterRef, Subquery, Q
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count
from django.forms import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models.functions import TruncDate

from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.utils.dateparse import parse_date

from .models import (
    BorrowRecord, Category, Item,  ItemInstance, ReturnRecord
)
from .serializers import (
    BorrowRecordSerializer, 
    CategorySerializer, ItemInstanceSerializer, ItemSerializer, ReturnRecordSerializer
)
from zoneinfo import ZoneInfo
timezone.activate(ZoneInfo("Asia/Manila"))


from users.models import Room

User = get_user_model()

class DeanDashboardView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request):
        try:
            total_borrow_records = ItemInstance.objects.filter(borrowrecords__return_date__isnull=True).count()  
            currently_borrowed = BorrowRecord.objects.order_by('-borrow_date')[:5]
            total_return_records = ReturnRecord.objects.count()

            most_borrowed_items = ItemInstance.objects.annotate(
                borrow_count=Count('borrowrecords')
            ).order_by('-borrow_count')[:5]

            data = {

                'total_borrow_records': total_borrow_records,
                'currently_borrowed': [
                    {
                        'id': record.id,
                        'borrower': f"{record.borrower.first_name} {record.borrower.last_name}" if record.borrower else record.custom_borrower or "Unknown",
                        'item': record.item_instance.item.name,
                        'room': record.room.name if record.room else None,
                        'borrow_date': record.borrow_date,
                    }
                        for record in currently_borrowed
                ],
                'total_return_records': total_return_records,
                'most_borrowed_items': [
                    {
                        'id': item.id, 
                        'name': item.item.name, 
                        'serial_number': item.serial_number, 
                        'borrow_count': item.borrow_count
                    }
                        for item in most_borrowed_items
                ],
            }

            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            dean_items = Item.objects.all().count()
            total_borrow_records = BorrowRecord.objects.filter(return_date__isnull=True).count()  
            currently_borrowed = BorrowRecord.objects.order_by('-borrow_date')[:5]
            total_return_records = ReturnRecord.objects.count()

            # Use aggregations and annotations to get most borrowed items and items needing attention
            most_borrowed_items = ItemInstance.objects.annotate(
                borrow_count=Count('borrowrecords')
            ).order_by('-borrow_count')[:7]

            items_needing_attention = ItemInstance.objects.filter(
                current_condition__in=['Poor', 'Damaged']
            )[:5]

            current_tz = timezone.get_current_timezone()
            end_date = timezone.now().astimezone(current_tz)
            start_date = (end_date - timezone.timedelta(days=6)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            all_dates = [
                (start_date + timezone.timedelta(days=x)).date() 
                for x in range(6, -1, -1)
            ]

            borrow_per_day = BorrowRecord.objects.filter(
                borrow_date__range=[
                    start_date.replace(hour=0, minute=0, second=0, microsecond=0),
                    end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                ]
            ).annotate(
                day=TruncDate('borrow_date', tzinfo=current_tz)
            ).values('day').annotate(
                count=Count('id')
            ).order_by('day')

            borrow_counts = {date: 0 for date in all_dates}
            for record in borrow_per_day:
                if record['day'] in borrow_counts:
                    borrow_counts[record['day']] = record['count']

            borrow_per_day_full = [
                {
                    'day': date.strftime('%Y-%m-%d'),
                    'count': borrow_counts[date]
                }
                for date in all_dates
            ]

            data = {
                'dean_items': dean_items,
                'total_borrow_records': total_borrow_records,
                'currently_borrowed': [
                    {
                        'id': record.id,
                        'borrower': f"{record.borrower.first_name} {record.borrower.last_name}" if record.borrower else record.custom_borrower or "Unknown",
                        'item': record.item_instance.item.name,
                        'borrow_date': record.borrow_date,
                    }
                        for record in currently_borrowed
                ],
                'total_return_records': total_return_records,
                'most_borrowed_items': [
                    {
                     'id': item.id, 
                     'name': item.item.name, 
                     'inventory_number': item.inventory_number, 
                     'borrow_count': item.borrow_count
                    }
                        for item in most_borrowed_items
                ],
                'items_needing_attention': [
                    {'id': item.id, 'name': item.item.name, 'serial_number': item.serial_number, 'condition': item.current_condition}
                    for item in items_needing_attention
                ],
                'borrow_per_day_full' : borrow_per_day_full
            }

            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class Pagination(PageNumberPagination):
    page_size = 10  
    page_size_query_param = 'page_size'
    max_page_size = 100

class DamagedItemsView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ItemInstanceSerializer
    pagination_class = Pagination

    def get_queryset(self):
        queryset = ItemInstance.objects.filter(current_condition='Damaged')

        search_query = self.request.query_params.get('search')
        category_id = self.request.query_params.get('category', '')
        value_filter = self.request.query_params.get('value_filter', '')
        start_date = self.request.query_params.get('start_date', '')
        end_date = self.request.query_params.get('end_date', '')

        if search_query:
            queryset = queryset.filter(
                Q(item__name__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(serial_number__icontains=search_query) |
                Q(unit_cost__icontains=search_query)
            )

        if category_id:
            queryset = queryset.filter(item__category_id=category_id)

        if value_filter:
            if value_filter.lower() == 'high':
                queryset = queryset.filter(unit_cost__gte=5000)
            elif value_filter.lower() == 'low':
                queryset = queryset.filter(unit_cost__lte=4999)

        if start_date and start_date.strip():
            start = parse_date(start_date.strip())
            if start:
                queryset = queryset.filter(purchase_date__gte=start)

        if end_date and end_date.strip():
            end = parse_date(end_date.strip())
            if end:
                queryset = queryset.filter(purchase_date__lte=end)

        # if (start_date and start_date.strip()) and (end_date and end_date.strip()):
        #     try:
        #         start = parse_date(start_date.strip())
        #         end = parse_date(end_date.strip())
        #         if start and end and start > end:
        #             return queryset.none()
        #     except (ValueError, TypeError) as e:
        #         print(f"Error parsing start_date or end_date: {e}")

        return queryset

class CategoryView(ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ItemsView(ListCreateAPIView):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Item.objects.all()

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query) |
                Q(item_type__icontains=search_query) |
                Q(model__icontains=search_query)
            )
        return queryset.order_by('name')
    

    def list (self, request, *args, **kwargs):
        export_param = request.query_params.get('export', '')

        if export_param == 'all':
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'results': serializer.data,
                'count': len(serializer.data)
            })
        
        return super().list(request, *args, **kwargs)
    
    def generate_unique_inventory_number(self, item_name):
        sanitized_name = re.sub(r'[^A-Za-z0-9]', '', item_name)[:5].upper()
        
        while True:
            inventory_number = f"{sanitized_name}-{uuid.uuid4().hex[:4].upper()}-{timezone.now().strftime('%Y-%m-%d')}"
            if not ItemInstance.objects.filter(inventory_number=inventory_number).exists():
                return inventory_number
    
    def post(self, request):
        serializer = ItemSerializer(data=request.data)
        if serializer.is_valid():
            # Save the item
            item = serializer.save()

            quantity_to_add = int(request.data.get('quantity', 0))
            unit_cost = request.data.get('unit_cost')
            purchase_date = request.data.get('purchase_date')
            useful_life = request.data.get('useful_life')

            if quantity_to_add > 0:
                instances = []
                
                # Handle differently based on item type
                if item.item_type == "Consumables":
                    # For Consumables, create a single instance with the total quantity
                    inventory_number = self.generate_unique_inventory_number(item.name)
                    instance = ItemInstance.objects.create(
                        item=item,
                        unit_cost=unit_cost or 0,
                        quantity=quantity_to_add,
                        inventory_number=inventory_number,
                        purchase_date=purchase_date,
                        useful_life=useful_life
                    )
                    instances.append(instance)
                    instance.save()
                    
                else:  # Non-Consumables
                    # Get inventory number components from request
                    inventory_date = request.data.get('inventory_date')
                    start_number = int(request.data.get('start_number', 1))
                    suffix = request.data.get('suffix', "01")
                    
                    # Create individual instances for each quantity
                    for i in range(quantity_to_add):
                        current_number = str(start_number + i).zfill(4)
                        inventory_number = f"{inventory_date}-{current_number}-{suffix}"
                        
                        instance = ItemInstance.objects.create(
                            item=item,
                            unit_cost=unit_cost or 0,
                            quantity=1,  # Each non-consumable instance has quantity of 1
                            inventory_number=inventory_number,
                            purchase_date=purchase_date,
                            useful_life=useful_life
                        )
                        instances.append(instance)
                        instance.save()

                # Update item quantity
                if item.item_type == "Consumables":
                    item.quantity = sum(instance.quantity for instance in instances)
                else:
                    item.quantity = len(instances)
                item.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ItemsDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        item = get_object_or_404(Item, pk=pk)
        serializer = ItemSerializer(item)
        return Response(serializer.data)

    def put(self, request, pk):
        item = get_object_or_404(Item, pk=pk)
        serializer = ItemSerializer(item, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        item = get_object_or_404(Item, pk=pk)
        serializer = ItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        item = get_object_or_404(Item, pk=pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class LatestItemtNumberView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only query non-consumable items (assuming they follow the YYYY-MM-DD-####-## format)
        # First filter to only get items with inventory numbers matching the expected format
        import re
        
        # Get all items that match the date-based format (YYYY-MM-DD-####-##)
        date_pattern = r'^\d{4}-\d{2}-\d{2}-\d+-\d+$'
        
        # Use regex to filter only the date-based format inventory numbers
        non_consumable_items = ItemInstance.objects.filter(
            inventory_number__regex=date_pattern
        ).order_by('-inventory_number')
        
        # Get the first (latest) item
        latest_instance = non_consumable_items.first()
        
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

class AllInstancesView(ListAPIView):
    serializer_class = ItemInstanceSerializer
    pagination_class = Pagination

    def get_queryset(self):
        queryset = ItemInstance.objects.all()

        search_query = self.request.query_params.get('search', '')
        category_id = self.request.query_params.get('category', '')
        value_filter = self.request.query_params.get('value_filter', '')
        start_date = self.request.query_params.get('start_date', '')
        end_date = self.request.query_params.get('end_date', '')
 
        if search_query:
            queryset = queryset.filter(
                Q(item__name__icontains=search_query) |
                Q(item__description__icontains=search_query) |
                Q(serial_number__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(current_condition__icontains=search_query) |
                Q(borrowrecords__borrower__first_name__icontains=search_query) |
                Q(borrowrecords__borrower__last_name__icontains=search_query) |
                Q(borrowrecords__custom_borrower__icontains=search_query)

            )
        
        if category_id:
            queryset = queryset.filter(item__category_id=category_id)

        if value_filter:
            if value_filter.lower() == 'high':
                queryset = queryset.filter(unit_cost__gte=5000)
            elif value_filter.lower() == 'low':
                queryset = queryset.filter(unit_cost__lte=4999)

        if start_date:
            start = parse_date(start_date.strip())
            if start:
                queryset = queryset.filter(purchase_date__gte=start)

        if end_date:
            end = parse_date(end_date.strip())
            if end:
                queryset = queryset.filter(purchase_date__lte=end)

        return queryset
    
class ItemInstanceView(ListAPIView):
    serializer_class = ItemInstanceSerializer
    pagination_class = Pagination

    def get_queryset(self):
        queryset = ItemInstance.objects.filter(
            item_id=self.kwargs['pk']).annotate(
            has_borrower=Exists(
            BorrowRecord.objects.filter(
                item_instance=OuterRef('pk'),
                return_date__isnull=True
            )
            ),
            latest_borrow_date=Subquery(
            BorrowRecord.objects.filter(
                item_instance=OuterRef('pk')
            ).order_by('-borrow_date')
            .values('borrow_date')[:1]
            )
        ).order_by('has_borrower', '-latest_borrow_date', 'id')

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(item__name__icontains=search_query) |
                Q(item__description__icontains=search_query) |
                Q(serial_number__icontains=search_query) |
                Q(inventory_number__icontains=search_query) |
                Q(current_condition__icontains=search_query)  |
                Q(borrowrecords__borrower__first_name__icontains=search_query) |
                Q(borrowrecords__borrower__last_name__icontains=search_query) |
                Q(borrowrecords__custom_borrower__icontains=search_query)
            )
        return queryset
    def generate_unique_inventory_number(self, item_name):
        sanitized_name = re.sub(r'[^A-Za-z0-9]', '', item_name)[:5].upper()
        
        while True:
            inventory_number = f"{sanitized_name}-{uuid.uuid4().hex[:4].upper()}-{timezone.now().strftime('%Y-%m-%d')}"
            if not ItemInstance.objects.filter(inventory_number=inventory_number).exists():
                return inventory_number
            
    @transaction.atomic
    def post(self, request, pk):
        try:
            item = get_object_or_404(Item, pk=pk)
            quantity_to_add = int(request.data.get('quantity', 0))
            unit_cost = request.data.get('unit_cost')
            purchase_date = request.data.get('purchase_date')
            useful_life = request.data.get('useful_life')

            start_number = request.data.get('start_number') if item.item_type == 'Non-Consumables' else None
            suffix = request.data.get('suffix') if item.item_type == 'Non-Consumables' else None
            inventory_date = request.data.get('inventory_date') if item.item_type == 'Non-Consumables' else None

            if quantity_to_add <= 0:
                return Response({"error": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
            if unit_cost is None or float(unit_cost) <= 0:
                return Response({"error": "Unit cost must be a positive value."}, status=status.HTTP_400_BAD_REQUEST)
            if not purchase_date:
                return Response({"error": "Purchase date is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            if item.item_type == 'Non-Consumables':
                if not start_number or not isinstance(start_number, (int, str)):
                    return Response({"error": "Valid start number is required."}, 
                                status=status.HTTP_400_BAD_REQUEST)
                if not suffix or not isinstance(suffix, (int, str)):
                    return Response({"error": "Valid suffix number is required."}, 
                                status=status.HTTP_400_BAD_REQUEST)
                if not inventory_date:
                    return Response({"error": "Inventory date is required."}, 
                                status=status.HTTP_400_BAD_REQUEST)
                start_num = int(start_number)

            instances = []

            if item.item_type == 'Consumables':
                inventory_number = self.generate_unique_inventory_number(item.name)
                instance = ItemInstance.objects.create(
                    item=item,
                    unit_cost=unit_cost,
                    quantity=quantity_to_add, 
                    serial_number=None,
                    inventory_number=inventory_number,
                    purchase_date=purchase_date,
                    useful_life=useful_life
                )
                instances = [instance]
                instance.save()
        
            else:
                for i in range(quantity_to_add):
                    current_number = str(start_num + i).zfill(4)  
                    inventory_number = f"{inventory_date}-{current_number}-{suffix}"

                    instance = ItemInstance.objects.create(
                        item=item,
                        unit_cost=unit_cost,
                        quantity=1,
                        serial_number=None,  
                        inventory_number=inventory_number,
                        purchase_date=purchase_date,
                        useful_life=useful_life
                    ) 
                    instances.append(instance)
                    instance.save()

            return Response(
                ItemInstanceSerializer(instances, many=True).data,
                status=status.HTTP_201_CREATED
            )
        except Item.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid data format."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class ItemInstanceDetailView(generics.RetrieveAPIView):
    queryset = ItemInstance.objects.all()
    serializer_class = ItemInstanceSerializer
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
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class CheckItemView(APIView):
    def get(self, request, inventory_number):
        try:
            # Clean the inventory number
            clean_inventory_number = inventory_number.strip()
            
            # Add logging for debugging
            print(f"Checking inventory number: {clean_inventory_number}")
            
            item_instance = get_object_or_404(ItemInstance, inventory_number=clean_inventory_number)
            current_borrow = item_instance.get_current_borrow_record()

            # Add logging for successful item find
            print(f"Found item: {item_instance.item.name}")

            return Response({
                'exists': True,
                'item_type': item_instance.item.item_type,
                'name': item_instance.item.name,
                'unit_cost': str(item_instance.unit_cost),  # Convert Decimal to string
                'quantity': item_instance.quantity,
                'inventory_number': item_instance.inventory_number,
                'condition': item_instance.current_condition,
                'availability': 'Available' if not current_borrow else 'Borrowed',
                'message': 'Item found successfully'
            })
        except ItemInstance.DoesNotExist:
            print(f"Item not found for inventory number: {inventory_number}")
            return Response({
                'exists': False,
                'message': 'Item not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            print(f"Validation error: {str(e)}")
            return Response({
                'exists': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({
                'exists': False,
                'message': 'An unexpected error occurred'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ScanItemView(APIView):
    def get(self, request, inventory_number):
        try:
            item_instance = get_object_or_404(ItemInstance, inventory_number=inventory_number)
            return Response({
                'exists': True,
                'item_type': item_instance.item.item_type,
                'name': item_instance.item.name,
                'unit_cost': str(item_instance.unit_cost),  # Convert Decimal to string
                'quantity': item_instance.quantity,
                'inventory_number': item_instance.inventory_number,
                'condition': item_instance.current_condition,
                'availability': 'Available' if not item_instance.get_current_borrow_record() else 'Borrowed',
                'message': 'Item found successfully'
            })
        except ItemInstance.DoesNotExist:
            return Response({
                'exists': False,
                'message': 'Item not found'
            }, status=status.HTTP_404_NOT_FOUND)


class ManualBorrowItemView(ListCreateAPIView):
    @transaction.atomic
    def post(self, request):
        user_id = request.data.get('user_id')
        custom_borrower = request.data.get('custom_borrower')
        items_data = request.data.get('instances', []) 
        room_id = request.data.get('room_id')
        purpose = request.data.get('purpose')
        duration = request.data.get('duration')

        # Input validation
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
        if not items_data:
            return Response({'error': 'At least one item barcode is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not room_id:
            return Response({'error': 'Room ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            borrower = None
            room = get_object_or_404(Room, id=room_id)
             
            if user_id:
                borrower = get_object_or_404(User, id=user_id)  

            borrow_date = timezone.now()
            borrow_records = []

            for item_data in items_data:
                item_id = item_data.get('id')
                quantity = item_data.get('quantity', 1)
                instance = ItemInstance.objects.select_for_update().get(id=item_id)

                if instance.item.item_type == 'Non-consumables':
                    if duration is not None:
                        try:
                            borrow_duration = int(duration)  # Convert to integer
                            if borrow_duration <= 0:
                                return Response(
                                    {'error': 'Borrow duration must be a positive integer.'},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                        except ValueError:
                            return Response(
                                {'error': 'Invalid borrow duration provided. It must be an integer.'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        borrow_duration = 1

                if instance.item.item_type == 'Consumables':
                    # Handle consumable items
                    if instance.quantity < quantity:
                        return Response(
                            {'error': f'Not enough quantity available for item {instance.id}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Reduce available quantity
                    instance.quantity -= quantity
                    instance.save()

                    # Create a single borrow record that's automatically marked as returned
                    borrow_record = BorrowRecord.objects.create(
                        item_instance=instance,
                        borrower=borrower,
                        custom_borrower=custom_borrower,
                        room=room,
                        duration=duration,                        borrow_date=borrow_date,
                        return_date=borrow_date,# Set return date immediately for consumables
                        quantity=quantity,
                        purpose=purpose
                    )

                    # Create the return record
                    ReturnRecord.objects.create(
                        item_instance=instance,
                        borrow_record=borrow_record,
                        return_date=borrow_date
                    )

                else:
                    # Handle non-consumable items
                    if instance.get_current_borrow_record():
                        return Response(
                            {'error': f'Item with ID {instance.id} is already borrowed'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Create borrow record without return date
                    borrow_record = BorrowRecord.objects.create(
                        item_instance=instance,
                        borrower=borrower,
                        custom_borrower=custom_borrower,
                        room=room,
                        duration=duration,
                        borrow_date=borrow_date,
                        quantity=quantity,
                        purpose=purpose
                    )

                borrow_records.append(borrow_record)

            serializer = BorrowRecordSerializer(borrow_records, many=True)
            return Response({
                'message': 'Items borrowed successfully',
                'borrow_records': serializer.data
            }, status=status.HTTP_200_OK)

        except ItemInstance.DoesNotExist:
            return Response({'error': f'Item with ID {item_id} not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BorrowItemView(ListCreateAPIView):
    @transaction.atomic
    def post(self, request):
        user_barcode = request.data.get('userBarcode')
        items_barcodes = request.data.get('items', [])
        room_id = request.data.get('room_id')

        if not user_barcode or not items_barcodes or not room_id:
            return Response({'error': 'User barcode, item barcodes, and room ID are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            borrower = get_object_or_404(User, barcode_value=user_barcode)
            room = get_object_or_404(Room, id=room_id)

            borrow_date = timezone.now()
            borrow_records = []

            for items_barcode in items_barcodes:
                instance = ItemInstance.objects.select_for_update().get(inventory_number=items_barcode)

                if instance.get_current_borrow_record():
                    return Response(
                        {'error': f'Item with ID {instance.id} is already borrowed'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                instance.save()

                borrow_record = BorrowRecord.objects.create(
                    item_instance=instance,
                    borrower=borrower,
                    room=room,
                    borrow_date=borrow_date
                )
                borrow_records.append(borrow_record)

            serializer = BorrowRecordSerializer(borrow_records, many=True)
            return Response({
                'message': 'Equipment borrowed successfully',
                'borrow_records': serializer.data
            }, status=status.HTTP_200_OK)

        except ItemInstance.DoesNotExist:
            return Response({'error': f'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ReturnItemInstanceView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    

    @transaction.atomic
    def post(self, request, instance_id):
        instance = get_object_or_404(ItemInstance, id=instance_id)

        notes = request.data.get('notes', '')
        new_condition = request.data.get('condition', '')

        if not request.user.is_secretary:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Find the current active borrow record
        try:
            borrow_record = BorrowRecord.objects.filter(
                item_instance=instance,
                return_date__isnull=True
            ).latest('borrow_date')
        except BorrowRecord.DoesNotExist:
            return Response({'message': 'Item is not borrowed'}, status=status.HTTP_400_BAD_REQUEST)

        return_date = timezone.now()

        # Update the BorrowRecord
        borrow_record.return_date = return_date
        borrow_record.save()

        # Create a new ReturnRecord
        return_record = ReturnRecord.objects.create(
            item_instance=instance,
            borrow_record=borrow_record,
            notes=notes,
            return_date=return_date
        )

        # Update the condition
        if new_condition in dict(ItemInstance.CONDITION_CHOICES).keys():
            instance.last_condition = instance.current_condition
            instance.current_condition = new_condition
        elif new_condition:
            return Response({'message': 'Invalid condition'}, status=status.HTTP_400_BAD_REQUEST)

        # Update last borrowed information using the current borrow record
        instance.last_borrowed_by = borrow_record.borrower
        instance.last_borrowed_at = borrow_record.borrow_date
        instance.last_location = borrow_record.room

        # Reset current location
        instance.current_location = None
        instance.save()

        borrow_serializer = BorrowRecordSerializer(borrow_record)
        return_serializer = ReturnRecordSerializer(return_record)

        return Response({
            'message': 'Item returned successfully',
            'borrow_record': borrow_serializer.data,
            'return_record': return_serializer.data
        }, status=status.HTTP_200_OK)

class BorrowedListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BorrowRecordSerializer
    pagination_class = Pagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = BorrowRecord.objects.filter(borrow_date__lte=timezone.now(), return_date__isnull=True)
        if self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(borrower=self.request.user)

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(item_instance__item__name__icontains=search_query) |
                Q(item_instance__inventory_number__icontains=search_query) |
                Q(item_instance__current_condition__icontains=search_query) |
                Q(borrower__username__icontains=search_query) |
                Q(room__name__icontains=search_query) |
                Q(custom_borrower__icontains=search_query)
            )
        
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = [item for item in serializer.data if item is not None]
        return Response(data)
    

class StaffBorrowedListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BorrowRecordSerializer

    def get(self, request):
        user_barcode = request.query_params.get('barcode')
        
        if not user_barcode:
            return Response({"error": "User barcode is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_object_or_404(User, barcode_value=user_barcode)
            
            borrowed_items = BorrowRecord.objects.filter(
                borrower=user,
                return_date__isnull=True
            ).select_related('item_instance__item', 'borrower', 'room').order_by('-borrow_date')

            serializer = BorrowRecordSerializer(borrowed_items, many=True)
            return Response(serializer.data)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ReturnedListView(ListAPIView):
    serializer_class = ReturnRecordSerializer
    pagination_class = Pagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = ReturnRecord.objects.filter(
            return_date__lte=timezone.now(),
            borrow_record__item_instance__item__item_type='Non-Consumables'
        ).order_by('-return_date')
        
        if self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(borrow_record__borrower=self.request.user)

        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(borrow_record__item_instance__item__name__icontains=search_query) |
                Q(borrow_record__item_instance__inventory_number__icontains=search_query) |
                Q(borrow_record__item_instance__current_condition__icontains=search_query) |
                Q(borrow_record__room__name__icontains=search_query) |
                Q(borrow_record__borrower__first_name__icontains=search_query) |
                Q(borrow_record__borrower__last_name__icontains=search_query) |
                Q(condition_on_return__icontains=search_query) |
                Q(notes__icontains=search_query)
            )
        
        return queryset

class DistrubutedListView(ListAPIView):
    serializer_class = ReturnRecordSerializer
    pagination_class = Pagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = ReturnRecord.objects.filter(
            return_date__lte=timezone.now(),
            borrow_record__item_instance__item__item_type='Consumables'
        ).order_by('-return_date')
        
        if self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(borrow_record__borrower=self.request.user)
        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(borrow_record__item_instance__item__name__icontains=search_query) |
                Q(borrow_record__item_instance__inventory_number__icontains=search_query) |
                Q(borrow_record__item_instance__current_condition__icontains=search_query) |
                Q(borrow_record__room__name__icontains=search_query) |
                Q(borrow_record__borrower__first_name__icontains=search_query) |
                Q(borrow_record__borrower__last_name__icontains=search_query) |
                Q(condition_on_return__icontains=search_query) |
                Q(notes__icontains=search_query)
            )
        
        return queryset
    
class UserBarcodeView(ListAPIView):
    def get(self, request):
        barcode = request.GET.get('barcode')
        if not barcode:
            return Response({'error': 'Barcode parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_object_or_404(User, custom_id=barcode)
            
            # Construct the landing page URL
            barcode_url = f'landing_page/{user.custom_id}/'
            frontend_domain = 'http://localhost:8080'   
            barcode_full_url = f'{frontend_domain}/{barcode_url}'

            return Response({
                'id': user.id,
                'custom_id': user.custom_id,
                'name': f"{user.first_name} {user.last_name}",
                'username': user.username,
                'user_type': user.user_type(),
                'barcode': user.barcode.url if user.barcode else None,
                'landing_page_url': barcode_full_url
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class BorrowTestView(ListAPIView):
    @transaction.atomic
    def post(self, request):
        user_barcode = request.data.get('userBarcode')
        item_barcodes = request.data.get('items', [])
        room_id = request.data.get('room_id')

        if not user_barcode or not item_barcodes or not room_id:
            return Response({'message': 'User barcode, item barcodes, and room ID are required'}, status=status.HTTP_400_BAD_REQUEST)

        borrower = get_object_or_404(User, barcode_value=user_barcode)
        room = get_object_or_404(Room, id=room_id)

        borrow_date = timezone.now()
        borrow_records = []

        for item_barcode in item_barcodes:
            try:
                instance = ItemInstance.objects.get(barcode=item_barcode)

                if instance.is_borrowed:
                    return Response({'message': f'Item with barcode {item_barcode} is already borrowed'}, status=status.HTTP_400_BAD_REQUEST)

                # Update the ItemInstance
                instance.is_borrowed = True
                instance.borrowed_at = borrow_date
                instance.borrowed_by = borrower
                instance.current_location = room
                instance.save()

                # Create a new BorrowRecord
                borrow_record = BorrowRecord.objects.create(
                    item_instance=instance,
                    borrower=borrower,
                    room=room,
                    borrow_date=borrow_date
                )
                borrow_records.append(borrow_record)

            except ItemInstance.DoesNotExist:
                return Response({'message': f'Item with barcode {item_barcode} not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BorrowRecordSerializer(borrow_records, many=True)
        return Response({
            'message': 'Items borrowed successfully',
            'borrow_records': serializer.data
        }, status=status.HTTP_200_OK)

class BorrowTransactionView(ListAPIView):
    @transaction.atomic

    def post(self, request):
        barcode = request.data.get('barcode')
        instance_id = request.data.get('instance_id')
        room_id = request.data.get('room_id')

        if not barcode or not instance_id or not room_id:
                return Response({'message': 'Barcode, Instance ID, and Room ID are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        borrower = get_object_or_404(User, custom_id=barcode)
        instance = get_object_or_404(ItemInstance, id=instance_id)
        room = get_object_or_404(Room, id=room_id)

        if instance.status != 'Available':
            return Response({'message': 'Item is not available for borrowing'}, status=status.HTTP_400_BAD_REQUEST)

        borrow_record = BorrowRecord.objects.create(
            item_instance=instance,
            borrower=borrower,
            room=room,
            borrow_date=timezone.now()
        )

        instance.update_borrow_status(borrow_record)

        serializer = BorrowRecordSerializer(borrow_record)
        return Response({
            'message': 'Item borrowed successfully',
            'borrow_record': serializer.data
        }, status=status.HTTP_200_OK)
    
class ReturnTransactionView(ListAPIView):

    @transaction.atomic

    def post(self, request, instance_id):
        instance = get_object_or_404(ItemInstance, id=instance_id)

        if instance.status != 'Borrowed':
            return Response({'message': 'Item is not currently borrowed'}, status=status.HTTP_400_BAD_REQUEST)

        borrow_record = instance.current_borrow_record
        borrow_record.return_date = timezone.now()
        borrow_record.status = 'Returned'
        borrow_record.save()

        instance.update_return_status()

        return Response({'message': 'Item returned successfully'}, status=status.HTTP_200_OK)
    
class MostBorrowedItemsView(APIView):
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        most_borrowed = ItemInstance.most_borrowed_overall(limit=limit)
        data = [{
            'item_name': instance.item.name,
            'serial_number': instance.serial_number,
            'borrow_count': instance.total_borrow_count
        } for instance in most_borrowed]
        return Response(data)
