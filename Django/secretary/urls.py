from django.urls import path
from . import views

app_name = "secretary"


urlpatterns = [
    #Items URLs
    path('items/', views.ItemsView.as_view(), name='items'),
    path('items/<int:pk>/delete/', views.ItemsDetailView.as_view(), name='items-delete'),
    path('items/<int:pk>/update/', views.ItemsDetailView.as_view(), name='items-update'),
    path('items/<int:pk>/instances/', views.ItemInstanceView.as_view(), name='instance'),
    path('instances/', views.AllInstancesView.as_view(), name='instances'),
    path('instances/<int:instance_id>/detail/', views.ItemInstanceDetailView.as_view(), name='instance-detail'),
    path('instances/<int:instance_id>/update/', views.ItemInstanceDetailView.as_view(), name='instance-update'),
    path('instances/<int:instance_id>/delete/', views.ItemInstanceDetailView.as_view(), name='instance-delete'),
    path('instances/<int:instance_id>/', views.ItemInstanceDetailView.as_view(), name='instance-list'),

    #Sidebar URLs
    path('secretary-dashboard/', views.DashboardView.as_view(), name='secretary-dashboard'),
    path('dean-dashboard/', views.DeanDashboardView.as_view(), name='dean-dashboard'),
    path('damaged-items/', views.DamagedItemsView.as_view(), name='damaged-items'),
    path('distributed-items/', views.DistrubutedListView.as_view(), name='distributed-items'),


    #Borrowed Items URLs
    path('item-instances/latest-number/', views.LatestItemtNumberView.as_view(), name='latest-item-number'),
    path('manual-borrow/', views.ManualBorrowItemView.as_view(), name='add-to-cart'),
    path('instances/<int:instance_id>/return/', views.ReturnItemInstanceView.as_view(), name='return-item'),

    path('staff-borrowed-items/', views.StaffBorrowedListView.as_view(), name='staff-borrowed-items'),
    path('borrowed-items/', views.BorrowedListView.as_view(), name='borrowed-items'),

    path('returned-items/', views.ReturnedListView.as_view(), name='returned-items'),


    path('check-item/<str:inventory_number>/', views.CheckItemView.as_view(), name='check-item'),
    path('most-borrowed-items/', views.MostBorrowedItemsView.as_view(), name='most-borrowed-items'),
    
    path('user-barcode/', views.UserBarcodeView.as_view(), name='user-barcode'),
    path('borrow/', views.BorrowItemView.as_view(), name='borrow'),

     
]




