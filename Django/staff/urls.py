from django.urls import path
from . import views

app_name = "staff"

urlpatterns = [

    path('staff-dashboard/', views.Dashboard.as_view(), name='dashboard'),

    # path('transfer-requests/pending/', views.TransferPendingRequestView.as_view(), name='transfer-request-list'),
    # path('dispose-requests/pending/', views.DisposePendingRequestView.as_view(), name='dispose-request-list'),
    # path('replace-requests/pending/', views.ReplacePendingRequestView.as_view(), name='replacement-request-list'),

    # path('transfer-requests/', views.TransferRequestCreateView.as_view(), name='transfer-request-list'),
    # path('dispose-requests/', views.DisposeRequestCreateView.as_view(), name='dispose-request-list'),
    # path('replace-requests/', views.ReplaceRequestCreateView.as_view(), name='replacement-request-list'),

    # path('assignee-transfer-requests/', views.AssigneeTransferRequestListView.as_view(), name='assignee-transfer-requests'),

    
    # path('transfer-list/', views.TransferListView.as_view(), name='transfer-list'),
    # path('dispose-list/', views.DisposeListView.as_view(), name='transfer-list'),
    # path('replace-list/', views.ReplaceListView.as_view(), name='transfer-list'),

    # path('transfer-request/<int:pk>/assignee-confirmation/', views.TransferConfirmationView.as_view(), name='assignee-confirmation'),

    # path('transfer-approvals/<int:pk>/', views.TransferApprovalView.as_view(), name='transfer-approval-list'),
    # path('dispose-approvals/<int:pk>/', views.DisposeApprovalView.as_view(), name='dispose-approval-list'),
    # path('replace-approvals/<int:pk>/', views.ReplaceApprovalView.as_view(), name='replace-approval-list'),

    path('available-instances/', views.AvailableInstancesView.as_view(), name='available-instances'),

]