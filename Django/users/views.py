from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView, RetrieveAPIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from django.db.models import Count, Q, Sum, F, Exists, OuterRef, Subquery, Q
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.models import AbstractUser
from django.shortcuts import get_object_or_404
from .models import Room, Department
from .serializers import UserSerializer, RoomSerializer,  DepartmentSerializer
from  staff.serializers import RoomDetailSerializer, StaffDetailSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class Pagination(PageNumberPagination):
    page_size = 10  
    page_size_query_param = 'page_size'
    max_page_size = 100


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'user_type': user.user_type()
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
class ChangePasswordView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('new')
        confirm_password = request.data.get('confirm')
        current_password = request.data.get('current') if not user.is_staff else None

        if not user.is_staff and not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New password and confirm password do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_staff and current_password == new_password:
            return Response({'error': 'New password cannot be the same as the current password.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 5:
            return Response({'error': 'New password must be at least 5 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)

class ProfileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def put(self, request, format=None):
        profile = request.FILES.get('profile')
        user = request.user

        if not profile:
            return Response({'error': 'Please upload a profile picture'}, status=status.HTTP_400_BAD_REQUEST)

        user.profile_picture = profile
        user.save()

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    def patch(self, request, format=None):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserInformationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({ 
            'id': user.pk,
            'custom_id': user.custom_id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type(),
            'contact_number': user.contact_number,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
        })

class UserCreateView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.set_password(request.data.get('password'))
            user.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
class UserDataView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({ 
            'id': user.pk,
            'custom_id': user.custom_id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type(),
            'contact_number': user.contact_number,
            'department': user.department.name if user.department else None,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
        })
    
class GetUserTypeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_types = set()
            
        if User.objects.filter(is_dean=True).exists():
                user_types.add('Dean')
            
        if User.objects.filter(is_admin=True).exists():
            user_types.add('Admin')
        
        if User.objects.filter(is_secretary=True).exists():
            user_types.add('Secretary')

        if User.objects.filter(is_labtech=True).exists():
            user_types.add('Lab Technician')
            
        return Response(list(user_types))
    

class UserUpdateView(APIView):
    authentication_classes = [TokenAuthentication] 
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, *args, **kwargs):
        return self.put(request, *args, **kwargs)
    

class RoomCreationView(APIView):
    def post(self, request):
        serializer = RoomSerializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save()
            return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UserCreationView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(commit=False)
            user.set_password(request.data.get('password'))
            user.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserDetailView(RetrieveUpdateDestroyAPIView):

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def put(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serialzer = UserSerializer(user, data=request.data, partial=True)
        if serialzer.is_valid():
            serialzer.save()
            return Response(serialzer.data)
        return Response(serialzer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminChangePasswordView(APIView):
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        new_password = request.data.get('new')
        confirm_password = request.data.get('confirm')

        if not new_password or not confirm_password:
            return Response({'error': 'Please provide all required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New password and confirm password do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        
class UserListView(ListAPIView):
    pagination_class = Pagination
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(is_superuser=False)

        search_query = self.request.query_params.get('search', '')
        user_type = self.request.query_params.get('user_type', '')
        department_id = self.request.query_params.get('department', '')

        if search_query:
            queryset = queryset.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(username__icontains=search_query) |
                Q(is_staff__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(department__name__icontains=search_query)
            )

        if user_type:
            # user_type = user_type.lower()
            if user_type.lower() == 'admin':
                queryset = queryset.filter(is_admin=True)
            elif user_type.lower() == 'secretary':
                queryset = queryset.filter(is_secretary=True)
            elif user_type.lower() == 'supply':
                queryset = queryset.filter(is_supply=True)
            elif user_type.lower() == 'dean':
                queryset = queryset.filter(is_dean=True)
            elif user_type.lower() == 'ictc':
                queryset = queryset.filter(is_ictc=True)
            elif user_type.lower() == 'lab technician':
                queryset = queryset.filter(is_labtech=True)
            elif user_type.lower() == 'staff':
                queryset = queryset.filter(is_staff=True)

        if department_id:
            queryset = queryset.filter(department_id=department_id)

        return queryset

class UsersView(ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class StaffListView(ListAPIView):
    pagination_class = Pagination
    queryset = User.objects.filter(is_staff=True, is_superuser=False)
    serializer_class = UserSerializer
    
class StaffDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = StaffDetailSerializer
    
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = StaffDetailSerializer(user)
        return Response(serializer.data)
    
    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def put(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serialzer = UserSerializer(user, data=request.data, partial=True)
        if serialzer.is_valid():
            serialzer.save()
            return Response(serialzer.data)
        return Response(serialzer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class RoomListView(ListAPIView):
    pagination_class = Pagination
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class RoomDetailView(APIView):
    serializer_class = RoomDetailSerializer
    queryset = Room.objects.all()
    lookup_field = 'id'
    pagination = Pagination

    def get_queryset(self):
        queryset = Room.objects.filter(item_instance=self.kwargs['id'])

        return queryset

    def get(self, request, *args, **kwargs):
        room = get_object_or_404(Room, id=kwargs['id'])
        serializer = RoomDetailSerializer(room)
        return Response(serializer.data)
    
    def delete(self, request, *args, **kwargs):
        room = get_object_or_404(Room, id=kwargs['id'])
        room.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class DepartmentDetailView(RetrieveAPIView):
    queryset = Department.objects.all()
    lookup_field = 'id'
    pagination = Pagination

    def delete(self, request, *args, **kwargs):
        department = get_object_or_404(Department, id=kwargs['id'])
        department.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# class StaffDetailView(RetrieveAPIView):
#     queryset = User.objects.filter(is_staff=True, is_superuser=False)
#     serializer_class = StaffDetailSerializer
#     lookup_field = 'id'
#     pagination = Pagination

#     def get_queryset(self):
#         queryset = User.objects.filter(id=self.kwargs['id'])

#         return queryset

class DepartmentListView(ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer