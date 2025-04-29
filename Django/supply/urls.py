from django.urls import path
from . import views

app_name = "supply"

urlpatterns = [
    
    path('category/', views.CategoryView.as_view(), name='category'),
    path('category/<int:pk>/update/', views.CategoryDetailView.as_view(), name='category-update'),
    path('category/<int:pk>/delete/', views.CategoryDetailView.as_view(), name='category-delete'),

    path('category/<int:pk>/instances/', views.CategoryInstanceView.as_view(), name='category-instances'),

    path('assigned-chemicals/', views.AssignedChemicalView.as_view(), name='assigned-chemicals'),
    path('chemical-assignment/', views.ChemicalAssignmentView.as_view(), name='chemical-assignment'),
    
    
]