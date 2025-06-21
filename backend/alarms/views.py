from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Alarm, Tenant, AlarmUpdate, AlarmImage
from .serializers import AlarmSerializer, TenantSerializer, AlarmUpdateSerializer, AlarmImageSerializer, UserBasicSerializer
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes
from django.db.models import CharField, Value
from django.db.models.functions import Concat
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 200
    page_query_param = 'page'

    def get_page_size(self, request):
        if self.page_size_query_param:
            page_size = request.query_params.get(self.page_size_query_param)
            if page_size:
                try:
                    page_size_int = int(page_size)
                    if page_size_int in [10, 25, 50, 100, 200]:
                        return page_size_int
                except (TypeError, ValueError):
                    pass
        return self.page_size

# Create your views here.

class AlarmViewSet(viewsets.ModelViewSet):
    queryset = Alarm.objects.all().prefetch_related('tenants').order_by('-created_at')
    serializer_class = AlarmSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    
    def get_queryset(self):
        print("\nDEBUG: get_queryset called")
        print("DEBUG: User:", self.request.user)
        print("DEBUG: User authenticated:", self.request.user.is_authenticated)
        
        queryset = super().get_queryset()
        
        # Get query parameters
        stage = self.request.query_params.get('stage', None)
        completed = self.request.query_params.get('completed', None)
        search = self.request.query_params.get('search', '').strip()
        address_filter = self.request.query_params.get('address', '').strip()
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        date_exact = self.request.query_params.get('date_exact', None)
        tenant_filter = self.request.query_params.get('tenant', '').strip()
        brand_filter = self.request.query_params.get('brand', '').strip()
        
        # Apply filters
        if stage:
            queryset = queryset.filter(stage=stage)
        if completed is not None:
            queryset = queryset.filter(completed=completed == 'true')
        if brand_filter:
            queryset = queryset.filter(brand=brand_filter)
            
        # Apply date filters
        if date_exact:
            try:
                queryset = queryset.filter(date=date_exact)
            except ValueError:
                pass  # Invalid date format, ignore
        else:
            if date_from:
                try:
                    queryset = queryset.filter(date__gte=date_from)
                except ValueError:
                    pass  # Invalid date format, ignore
            if date_to:
                try:
                    queryset = queryset.filter(date__lte=date_to)
                except ValueError:
                    pass  # Invalid date format, ignore
        
        # Handle tenant filtering
        if tenant_filter:
            queryset = queryset.filter(
                Q(tenants__name__iexact=tenant_filter)
            ).distinct()
        
        # Handle address filtering separately
        if address_filter:
            # Simple approach: create the same concatenated address for each alarm
            # and match it exactly against the selected address
            queryset_with_addresses = queryset.annotate(
                full_address=Concat(
                    'street_number',
                    Value(' '),
                    'street_name',
                    Value(', '),
                    'suburb',
                    Value(', '),
                    'state',
                    Value(' '),
                    'postal_code',
                    output_field=CharField()
                )
            )
            
            # Clean up the address filter for comparison
            cleaned_address_filter = ' '.join(address_filter.split())  # Remove extra spaces
            
            # Filter for exact address match
            queryset = queryset_with_addresses.filter(
                full_address__iexact=cleaned_address_filter
            ).distinct().prefetch_related('tenants')
        
        # Handle general search (excluding address if address filter is used)
        if search and not address_filter:
            search_terms = search.split()
            q_objects = Q()
            
            for term in search_terms:
                q_objects |= (
                    Q(realestate_name__icontains=term) |
                    Q(street_number__icontains=term) |
                    Q(street_name__icontains=term) |
                    Q(suburb__icontains=term) |
                    Q(city__icontains=term) |
                    Q(state__icontains=term) |
                    Q(postal_code__icontains=term) |
                    Q(who_contacted__icontains=term) |
                    Q(work_order_number__icontains=term) |
                    Q(tenants__name__icontains=term) |
                    Q(tenants__phone__icontains=term)
                )
            
            # Apply search filter and ensure we still have prefetch_related
            queryset = queryset.filter(q_objects).distinct().prefetch_related('tenants')
            
        return queryset.order_by('-date')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        print("\nDEBUG: Create method called")
        print("DEBUG: Request user:", request.user)
        print("DEBUG: Request user authenticated:", request.user.is_authenticated)
        print("DEBUG: Request user session:", dict(request.session))
        print("DEBUG: Request data:", request.data)
        print("DEBUG: Request headers:", request.headers)
        print("DEBUG: Request method:", request.method)
        print("DEBUG: Request auth:", request.auth)
        
        if not request.user.is_authenticated:
            print("DEBUG: User is not authenticated!")
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            response = super().create(request, *args, **kwargs)
            print("DEBUG: Create successful")
            return response
        except Exception as e:
            print("DEBUG: Create failed with error:", str(e))
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        print("\nDEBUG: perform_create called")
        print("DEBUG: Current user:", self.request.user)
        try:
            serializer.save()
            print("DEBUG: Serializer save successful")
        except Exception as e:
            print("DEBUG: Serializer save failed with error:", str(e))
            print("DEBUG: Serializer errors:", serializer.errors)
            raise

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all().select_related('alarm')
    serializer_class = TenantSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_address_suggestions(request):
    """
    Get unique address suggestions based on search query
    """
    search_query = request.GET.get('q', '').strip()
    
    if len(search_query) < 2:
        return Response([])
    
    # Build address concatenation with proper formatting
    addresses = Alarm.objects.annotate(
        full_address=Concat(
            'street_number',
            Value(' '),
            'street_name',
            Value(', '),
            'suburb',
            Value(', '),
            'state',
            Value(' '),
            'postal_code',
            output_field=CharField()
        )
    ).filter(
        Q(street_number__icontains=search_query) |
        Q(street_name__icontains=search_query) |
        Q(suburb__icontains=search_query) |
        Q(city__icontains=search_query) |
        Q(state__icontains=search_query) |
        Q(postal_code__icontains=search_query)
    ).values('full_address').distinct().order_by('full_address')[:20]  # Limit to 20 results
    
    # Format the response
    suggestions = []
    for addr in addresses:
        full_addr = addr['full_address']
        # Clean up the address (remove extra spaces, commas)
        full_addr = ' '.join(full_addr.split())  # Remove extra spaces
        full_addr = full_addr.replace(' ,', ',')  # Fix spacing around commas
        if full_addr and full_addr != ', ,':  # Only include valid addresses
            suggestions.append({
                'value': full_addr,
                'label': full_addr
            })
    
    return Response(suggestions)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tenant_suggestions(request):
    """
    Get unique tenant suggestions based on search query
    """
    search_query = request.GET.get('q', '').strip()
    
    if len(search_query) < 2:
        return Response([])
    
    # Search for tenants
    tenants = Tenant.objects.filter(
        Q(name__icontains=search_query) |
        Q(phone__icontains=search_query)
    ).values('name', 'phone').distinct().order_by('name')[:20]  # Limit to 20 results
    
    # Format the response
    suggestions = []
    for tenant in tenants:
        label = f"{tenant['name']} ({tenant['phone']})"
        suggestions.append({
            'value': tenant['name'],
            'label': label
        })
    
    return Response(suggestions)

class AlarmUpdateViewSet(viewsets.ModelViewSet):
    queryset = AlarmUpdate.objects.all().select_related('alarm', 'created_by')
    serializer_class = AlarmUpdateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        alarm_id = self.request.query_params.get('alarm', None)
        
        if alarm_id:
            queryset = queryset.filter(alarm_id=alarm_id)
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save()

    def list(self, request, *args, **kwargs):
        # If no alarm_id is provided, return a 400 error
        if not request.query_params.get('alarm'):
            return Response(
                {"detail": "alarm parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().list(request, *args, **kwargs)

class AlarmImageViewSet(viewsets.ModelViewSet):
    queryset = AlarmImage.objects.all()
    serializer_class = AlarmImageSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print("\nDEBUG: Starting image upload")
        print(f"DEBUG: Request data: {request.data}")
        print(f"DEBUG: Files: {request.FILES}")
        
        try:
            # Validate input
            alarm_id = request.data.get('alarm')
            images = request.FILES.getlist('images')
            
            print(f"DEBUG: Alarm ID: {alarm_id}")
            print(f"DEBUG: Number of images: {len(images)}")
            
            if not alarm_id or not images:
                return Response(
                    {'error': 'Both alarm ID and images are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                alarm = Alarm.objects.get(id=alarm_id)
                print(f"DEBUG: Found alarm: {alarm}")
            except Alarm.DoesNotExist:
                return Response(
                    {'error': 'Alarm not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check S3 configuration
            from django.conf import settings
            print(f"DEBUG: S3 Settings:")
            print(f"DEBUG: AWS_ACCESS_KEY_ID exists: {bool(settings.AWS_ACCESS_KEY_ID)}")
            print(f"DEBUG: AWS_SECRET_ACCESS_KEY exists: {bool(settings.AWS_SECRET_ACCESS_KEY)}")
            print(f"DEBUG: AWS_STORAGE_BUCKET_NAME: {settings.AWS_STORAGE_BUCKET_NAME}")
            print(f"DEBUG: AWS_S3_ENDPOINT_URL: {settings.AWS_S3_ENDPOINT_URL}")
            
            created_images = []
            for image in images:
                print(f"\nDEBUG: Processing image: {image.name}")
                print(f"DEBUG: Image content type: {image.content_type}")
                print(f"DEBUG: Image size: {image.size} bytes")
                
                try:
                    # Create the image object
                    alarm_image = AlarmImage(
                        alarm=alarm,
                        uploaded_by=request.user
                    )
                    
                    # Assign the image file
                    alarm_image.image = image
                    
                    # Save the object (this will trigger the save method with image processing)
                    alarm_image.save()
                    print(f"DEBUG: Successfully created AlarmImage object: {alarm_image.id}")
                    
                    # Try to get the URL
                    try:
                        url = alarm_image.image.url
                        print(f"DEBUG: Generated URL: {url}")
                    except Exception as url_err:
                        print(f"DEBUG: Error generating URL: {str(url_err)}")
                        print(f"DEBUG: URL error traceback:")
                        import traceback
                        print(traceback.format_exc())
                        # Don't raise here, just log the error
                    
                    created_images.append(alarm_image)
                    
                except Exception as img_err:
                    print(f"DEBUG: Error processing individual image: {str(img_err)}")
                    print(f"DEBUG: Image processing error traceback:")
                    import traceback
                    print(traceback.format_exc())
                    # If this image fails, try to clean up
                    try:
                        if alarm_image.id:
                            alarm_image.delete()
                    except:
                        pass
                    # Return error for this specific image
                    return Response(
                        {'error': f'Error processing image {image.name}: {str(img_err)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            serializer = self.get_serializer(created_images, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"DEBUG: Unexpected error in create view: {str(e)}")
            print(f"DEBUG: Full error traceback:")
            import traceback
            print(traceback.format_exc())
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserBasicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user_ids = self.request.query_params.getlist('ids[]', [])
        if user_ids:
            queryset = queryset.filter(id__in=user_ids)
        return queryset
