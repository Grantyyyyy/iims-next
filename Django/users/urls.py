from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    #Authentication URLs
    path('login/', views.LoginView.as_view(), name='login'),
    path('user/', views.UserDataView.as_view(), name='user_data'),
    path('user/update/', views.UserUpdateView.as_view(), name='user_update'),
    path('user-list/', views.UserListView.as_view(), name='user_list'),
    path('user-types/', views.GetUserTypeView.as_view(), name='user-detail'),
    path('users/', views.UsersView.as_view(), name='users'),
    path('user/<int:pk>/update/', views.UserDetailView.as_view(), name='user-detail'),
    path('user/<int:pk>/delete/', views.UserDetailView.as_view(), name='user-delete'),
    path('user/admin/<int:pk>/change-password/', views.AdminChangePasswordView.as_view(), name='admin-change-password'),
    path('user/change_password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    #Staff URLs
    path('staff-list/', views.StaffListView.as_view(), name='staff_list'),
    path('add-user/', views.UserCreateView.as_view(), name='add_user'),
    path('staffs/<int:pk>/detail/', views.StaffDetailView.as_view(), name='staff-detail'),
    path('profile-upload/', views.ProfileUploadView.as_view(), name='profile_upload'),
    path('staff/<int:pk>/update/', views.StaffDetailView.as_view(), name='staff-update'),
    path('staff/<int:pk>/delete/', views.StaffDetailView.as_view(), name='staff-delete'),

    #Rooms URLs
    path('room-list/', views.RoomListView.as_view(), name='room_list'),    
    path('add-room/', views.RoomCreationView.as_view(), name='add_room'),                                                                                                                                   
    path('rooms/<int:id>/detail/', views.RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<int:id>/delete/', views.RoomDetailView.as_view(), name='room-delete'),

    #Department URLs
    path('department/', views.DepartmentListView.as_view(), name='department'),
    path('department/<int:id>/delete/', views.DepartmentDetailView.as_view(), name='department-delete'),


]
