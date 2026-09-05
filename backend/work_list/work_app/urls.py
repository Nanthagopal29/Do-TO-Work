from django.urls import path
from . import views

urlpatterns = [
    path('trs_workentry/', views.trs_workentry, name='trs_workentry'),
    path('trs_workentry/<int:id>/', views.trs_workentry, name='trs_workentry'),
    path('workentry_pause/',views.workentry_pause_api, name='workentry_pause_api'),
    path('user_master/', views.user_master_api, name='user_master'),
    path('project_master/', views.project_master_api, name='project_master'),
    path('category_master/', views.category_master_api, name='category_master'),
    path('subcategory_master/', views.subcategory_master_api, name='subcategory_master'),
    path('task_master/', views.task_master_api, name='task_master'),
    path('task_master/<int:id>/', views.task_master_api, name='task_master_detail'),
   
]