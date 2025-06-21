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
from rest_framework.exceptions import ValidationError

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
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        try:
            print("\n=== Starting Image Upload Process ===")
            print(f"Request Data: {self.request.data}")
            print(f"Request Files: {self.request.FILES}")
            
            # Get the alarm ID from the request data
            alarm_id = self.request.data.get('alarm')
            print(f"Alarm ID from request: {alarm_id}")
            
            if not alarm_id:
                print("Error: No alarm ID provided")
                raise ValidationError('Alarm ID is required')

            # Get the update time if provided
            update_time = self.request.data.get('update_time')
            print(f"Update time from request: {update_time}")
            
            # Save each image
            images = self.request.FILES.getlist('images')
            print(f"Number of images received: {len(images)}")
            
            if not images:
                print("Error: No images provided in request")
                raise ValidationError('No images provided')

            created_images = []
            for idx, image in enumerate(images):
                print(f"\nProcessing image {idx + 1}/{len(images)}")
                print(f"Image name: {image.name}")
                print(f"Image size: {image.size} bytes")
                print(f"Image content type: {image.content_type}")
                
                try:
                    # Create the image instance
                    print("Creating AlarmImage instance...")
                    instance = AlarmImage(
                        alarm_id=alarm_id,
                        image=image,
                        uploaded_by=self.request.user,
                        description=f"Image uploaded by {self.request.user.get_full_name() or self.request.user.email}"
                    )
                    
                    # Save with the update time
                    print(f"Saving image with update time: {update_time}")
                    instance.save(update_time=update_time)
                    print(f"Successfully saved image with ID: {instance.id}")
                    
                    created_images.append(instance)
                except Exception as img_err:
                    print(f"Error saving individual image: {str(img_err)}")
                    import traceback
                    print(f"Traceback: {traceback.format_exc()}")
                    raise ValidationError(f"Error saving image {image.name}: {str(img_err)}")

            print(f"\nSuccessfully created {len(created_images)} images")
            return created_images
            
        except Exception as e:
            print(f"\nError in perform_create: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise ValidationError(str(e))

    def create(self, request, *args, **kwargs):
        try:
            print("\n=== Starting create method ===")
            created_images = self.perform_create(serializer=None)
            print("Getting serializer for response...")
            serializer = self.get_serializer(created_images, many=True)
            print("Returning successful response")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            print(f"Validation error in create: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error in create: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get the current user's details"""
    serializer = UserBasicSerializer(request.user)
    return Response(serializer.data)
