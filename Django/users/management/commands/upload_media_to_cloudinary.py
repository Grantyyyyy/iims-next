# yourapp/management/commands/migrate_to_cloudinary.py
import os
from django.core.management.base import BaseCommand
from django.conf import settings
import cloudinary.uploader
from secretary.models import ItemInstance  # Replace with your actual model that has image fields
from labtech.models import EquipmentInstance, ApparatusInstance, ChemicalStock  # Replace with your actual model that has image fields


class Command(BaseCommand):
    help = 'Migrate existing barcode images to Cloudinary'

    def handle(self, *args, **options):
        # Ensure Cloudinary is configured
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')
        
        if not cloud_name or not api_key or not api_secret:
            self.stdout.write(self.style.ERROR(
                "Missing Cloudinary credentials in environment variables."
            ))
            return
        
        # Configure Cloudinary explicitly with env vars
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        
        self.stdout.write(f"Using Cloudinary with cloud name: {cloud_name}")
        
        # Get all instances with barcode images
        instances = ChemicalStock.objects.exclude(barcode='').exclude(barcode__isnull=True)
        self.stdout.write(f"Found {instances.count()} instances with barcodes")
        
        success_count = 0
        error_count = 0
        
        # Define search directories
        media_roots = [
            settings.MEDIA_ROOT if hasattr(settings, 'MEDIA_ROOT') else None,
            os.path.join(settings.BASE_DIR, 'media'),
        ]
        media_roots = [path for path in media_roots if path and os.path.exists(path)]
        
        for instance in instances:
            try:
                # Get the relative path as stored in the database
                relative_path = str(instance.barcode)
                
                # Try different approaches to find the file
                found_path = None
                
                # Approach 1: Direct paths from media roots
                for media_root in media_roots:
                    test_path = os.path.join(media_root, relative_path)
                    if os.path.exists(test_path):
                        found_path = test_path
                        break
                
                # Approach 2: Search by filename if exact path not found
                if not found_path:
                    file_name = os.path.basename(relative_path)
                    for media_root in media_roots:
                        for root, dirs, files in os.walk(media_root):
                            if file_name in files:
                                found_path = os.path.join(root, file_name)
                                self.stdout.write(f"Found at alternative location: {found_path}")
                                break
                        if found_path:
                            break
                
                if found_path:
                    # Upload to Cloudinary
                    file_name = os.path.basename(found_path)
                    folder_path = os.path.dirname(relative_path)
                    
                    upload_result = cloudinary.uploader.upload(
                        found_path,
                        folder=folder_path,  # Maintain folder structure
                        public_id=os.path.splitext(file_name)[0]  # Use filename without extension
                    )
                    
                    # Update the instance with new Cloudinary URL
                    instance.barcode = upload_result['secure_url']
                    instance.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'Successfully migrated: {file_name}\n'
                        f'To: {instance.barcode}'
                    ))
                    success_count += 1
                else:
                    self.stdout.write(self.style.WARNING(f'File not found: {relative_path}'))
                    error_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error migrating {instance.id}: {str(e)}'))
                error_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Migration complete. Success: {success_count}, Errors: {error_count}'))