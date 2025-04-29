from django.contrib import admin
from . models import Category, Item, ItemInstance,  BorrowRecord, ReturnRecord

admin.site.register(Category)
admin.site.register(Item) 
admin.site.register(ItemInstance)
admin.site.register(BorrowRecord)
admin.site.register(ReturnRecord)



