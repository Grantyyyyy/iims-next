from django.contrib import admin
from . models import TransferRequest, DisposeRequest, ReplaceRequest



admin.site.register(TransferRequest)
admin.site.register(ReplaceRequest)
admin.site.register(DisposeRequest)