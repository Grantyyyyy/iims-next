from django.urls import path
from . import views

app_name = "labtech"

urlpatterns = [

    # path("labtech-category/", views.CategoryListView.as_view(), name="chemicals"),
    path("units/", views.UnitListView.as_view(), name="units"),
    
    path('labtech-category/', views.LabCategoryView.as_view(), name='lab-categories'),
    path('labtech-category/<int:pk>/update/', views.LabCategoryDetailView.as_view(), name='lab-category-update'),
    path('labtech-category/<int:pk>/delete/', views.LabCategoryDetailView.as_view(), name='lab-category-delete'),

    path('labtech-category/<int:pk>/instances/', views.LabCategoryInstanceView.as_view(), name='lab-category-instances'),

    path('labtech-dashboard/', views.DashboardView.as_view(), name='dashboard'),

    path('subject-list/', views.SubjectListView.as_view(), name='subject-list'),
    path('subject/<int:pk>/update/', views.SubjectDetailView.as_view(), name='subject-update'),
    path('subject/<int:pk>/delete/', views.SubjectDetailView.as_view(), name='subject-delete'),

    path('equipment-instances/latest-number/', views.LatestEquipmentNumberView.as_view(), name='latest-equipment-number'),

    path('eq-instances/', views.AllEquipmentInstanceListView.as_view(), name='all-equipment-instances'),

    path('equipments/', views.EquipmentView.as_view(), name='equipment'),
    path('equipments/<int:pk>/update/', views.EquipmentDetailView.as_view(), name='equipment-update'),
    path('equipments/<int:pk>/delete/', views.EquipmentDetailView.as_view(), name='equipment-delete'),

    path('equipments/<int:pk>/instances/', views.EquipmentInstanceListView.as_view(), name='equipment-detail'),
    path('eq-instances/<int:instance_id>/detail/', views.EquipmentInstanceDetailView.as_view(), name='instance-detail'),
    path('eq-instances/<int:instance_id>/update/', views.EquipmentInstanceDetailView.as_view(), name='instance-update'),
    path('eq-instances/<int:instance_id>/delete/', views.EquipmentInstanceDetailView.as_view(), name='instance-delete'),


    path('return-equipment/<int:pk>/', views.ReturnEquipmentInstanceView.as_view(), name='return'),
    path('equipment-instances/', views.EquipmentInstanceListView.as_view(), name='equipment-instances'),

    path('borrowed-equipment-list/', views. BorrowedEquipmentListView.as_view(), name='borrowed-equipment'),
    path('returned-equipment-list/', views.EquipmentReturnListView.as_view(), name='returned-equipment'),

    path('borrow-equipment/', views.EquipmentBorrow.as_view(), name='equipment-borrow'),
    path('equipment-instances/<int:instance_id>/return/', views.EquipmentReturnView.as_view(), name='return-equipment'),


    path('assign-equipment/', views.EquipmentAssignment.as_view(), name='equipment-assign'),


    path('assigned-equipment-list/', views.AssignedEquipmentListView.as_view(), name='assigned-equipment'),
    path('dean-assigned-equipments/', views.DeanAssignedEquipmentListView.as_view(), name='dean-assigned-equipment'),



    path('eq-instances/<int:instance_id>/return/', views.EquipmentReturn.as_view(), name='return-equipment'),

    path('chemical/<int:pk>/stocks/', views.ChemicalStockView.as_view(), name='chemical-instance'),
    path('chemical/', views.ChemicalView.as_view(), name='chemicals'),
    path('chemical/<int:pk>/update/', views.ChemicalDetailView.as_view(), name='chemical-update'),
    path('chemical/<int:pk>/delete/', views.ChemicalDetailView.as_view(), name='chemical-delete'),

    path('chemical-usage/', views.ChemicalUsageView.as_view(), name='chemical-usage'),
    path('chemical-request/', views.ChemicalRequestView.as_view(), name='chemical-request'),



    path('apparatus/', views.ApparatusView.as_view(), name='apparatus'),
    path('apparatus/<int:pk>/update/', views.ApparatusDetailView.as_view(), name='apparatus-update'),
    path('apparatus/<int:pk>/delete/', views.ApparatusDetailView.as_view(), name='apparatus-delete'),

    path('apparatus/<int:pk>/instances/', views.ApparatusInstanceView.as_view(), name='apparatus-detail'),
    path('apparatus-instances/<int:instance_id>/detail/', views.ApparatusInstanceDetailView.as_view(), name='apparatus-instances'),
    path('apparatus-instances/<int:instance_id>/update/', views.ApparatusInstanceDetailView.as_view(), name='apparatus-update'),
    path('apparatus-instances/<int:instance_id>/delete/', views.ApparatusInstanceDetailView.as_view(), name='apparatus-delete'),

    path('borrow-apparatus/', views.ApparatusBorrowView.as_view(), name='apparatus-borrow'),
    path('apparatus-instances/<int:instance_id>/return/', views.ApparatusReturnView.as_view(), name='return-apparatus'),


    path('borrowed-apparatus/', views.ApparatusBorrowListView.as_view(), name='borrowed-apparatus'),
    path('returned-apparatus/', views.ApparatusReturnListView.as_view(), name='return-apparatus'),


]