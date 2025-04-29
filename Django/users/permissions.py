from rest_framework.permissions import BasePermission
from django.contrib.auth.models import User

from rest_framework.permissions import BasePermission

get_user_model = User

class IsStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class IsSecretary(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_secretary
    
class IsLabtech(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_labtech
