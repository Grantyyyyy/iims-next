# yourapp/management/commands/update_barcode_urls.py
from django.core.management.base import BaseCommand
from django.conf import settings
import cloudinary
import cloudinary.api
import os
from secretary.models import ItemInstance  # Replace with your actual app name

class Command(BaseCommand):
    help = 'Update database records with Cloudinary URLs'

    def handle(self, *args, **options):
        # Configure Cloudinary
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')
        
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        
        # Get all instances with barcode images
        instances = ItemInstance.objects.exclude(barcode='').exclude(barcode__isnull=True)
        self.stdout.write(f"Found {instances.count()} instances with barcodes")
        
        updated_count = 0
        error_count = 0
        
        # Base URL pattern to detect old URLs
        old_url_patterns = [
            'https://iims-django.onrender.com/media/',
            '/media/',
            'media/'
        ]
        
        for instance in instances:
            try:
                barcode_str = str(instance.barcode)
                
                # Check if this is an old URL
                if any(pattern in barcode_str for pattern in old_url_patterns):
                    # Extract the filename
                    filename = os.path.basename(barcode_str)
                    name_without_ext = os.path.splitext(filename)[0]
                    
                    # Search for this asset in Cloudinary
                    search_result = cloudinary.api.resources(
                        type="upload",
                        prefix=f"barcode/item_barcodes/{name_without_ext}",
                        max_results=1
                    )
                    
                    if search_result.get('resources'):
                        # Found matching resource in Cloudinary
                        cloudinary_url = search_result['resources'][0]['secure_url']
                        
                        # Update the instance
                        instance.barcode = cloudinary_url
                        instance.save()
                        
                        self.stdout.write(self.style.SUCCESS(
                            f'Updated URL for {filename}:\n'
                            f'From: {barcode_str}\n'
                            f'To: {cloudinary_url}'
                        ))
                        updated_count += 1
                    else:
                        # Try alternative search by public_id pattern
                        alt_search = cloudinary.api.resources(
                            type="upload",
                            prefix="barcode/item_barcodes",
                            max_results=500
                        )
                        
                        # Look for matching filename pattern
                        found = False
                        for resource in alt_search.get('resources', []):
                            if name_without_ext in resource['public_id']:
                                # Found a match
                                cloudinary_url = resource['secure_url']
                                instance.barcode = cloudinary_url
                                instance.save()
                                
                                self.stdout.write(self.style.SUCCESS(
                                    f'Updated URL for {filename} (alternative match):\n'
                                    f'From: {barcode_str}\n'
                                    f'To: {cloudinary_url}'
                                ))
                                updated_count += 1
                                found = True
                                break
                        
                        if not found:
                            self.stdout.write(self.style.WARNING(
                                f'No matching Cloudinary resource found for: {filename}'
                            ))
                            error_count += 1
                else:
                    # Already seems to be a Cloudinary URL
                    self.stdout.write(f'Skipping URL that appears to be already updated: {barcode_str[:50]}...')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error updating {instance.id}: {str(e)}'))
                error_count += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'Update complete. Updated: {updated_count}, Errors: {error_count}'
        ))