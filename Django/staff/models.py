from django.db import models
from django.contrib.auth import get_user_model
from secretary.models import ItemInstance
from users.models import Room


User = get_user_model()


class Status(models.Model):
    status = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.status

class TransferRequest(models.Model):
    STATUS_CHOICES = [
        ('AWAITING_ASSIGNEE_CONFIRMATION', 'Waiting for Assignee'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approval Granted'),
        ('REJECTED', 'Approval Denied'),
        ('ASSIGNEE_REJECTED', 'Declined by Assignee')
    ]
    item_instance = models.ForeignKey(ItemInstance, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transfer_requests')
    requested_date = models.DateTimeField(auto_now_add=True)
    new_assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='new_assigned_item')
    new_location = models.ForeignKey(Room, on_delete=models.CASCADE)
    transfer_reason = models.TextField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_transfer')
    processed_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')

class ReplaceRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected')
    ]
    item_instance = models.ForeignKey(ItemInstance, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='replace_requests')
    requested_date = models.DateTimeField(auto_now_add=True)
    replacement_item = models.ForeignKey(ItemInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='replacement_for')
    replacement_reason = models.TextField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_replace')
    processed_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

class DisposeRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected')
    ]
    item_instance = models.ForeignKey(ItemInstance, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dispose_requests')
    requested_date = models.DateTimeField(auto_now_add=True)
    disposal_reason = models.TextField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_dispose')
    processed_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

