import os
import django
from django.apps import apps
from django.db.models import NOT_PROVIDED
from openpyxl import Workbook

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "capstone.settings")
django.setup()

# Create a new workbook
wb = Workbook()
ws = wb.active
ws.title = "Data Dictionary"

# Write headers
ws.append([
    "Model Name", "Field Name", "Field Type", "Null", "Blank", "Default", "Help Text"
])

# Loop through models and fields
for model in apps.get_models():
    for field in model._meta.fields:
        # Handle default value
        if field.default != NOT_PROVIDED:
            default = field.default() if callable(field.default) else field.default
            default = str(default) if not callable(field.default) else f"function: {field.default.__name__}"
        else:
            default = "None"
        
        help_text = str(field.help_text).replace("\n", " ")
        
        ws.append([
            model.__name__,
            field.name,
            field.get_internal_type(),
            field.null,
            field.blank,
            default,
            help_text
        ])

# Save Excel file
wb.save("data_dictionary.xlsx")
print("✅ Excel file generated: data_dictionary.xlsx")
