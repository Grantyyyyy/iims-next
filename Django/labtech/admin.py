from django.contrib import admin
from . models import *


admin.site.register(Subject)
admin.site.register(LabCategory)
admin.site.register(Unit)
admin.site.register(Equipment)
admin.site.register(EquipmentInstance)
admin.site.register(EquipmentBorrowRecord)
admin.site.register(EquipmentReturnRecord)
admin.site.register(EquipmentAssignmentRecord)
admin.site.register(Chemical)
admin.site.register(ChemicalStock)
admin.site.register(ChemicalUsage)
admin.site.register(Apparatus)
admin.site.register(ApparatusInstance)
admin.site.register(ApparatusBorrowRecord)




