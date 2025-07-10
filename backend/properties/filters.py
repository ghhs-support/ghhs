import django_filters as filters
from django.db.models import Q
from .models import Property, Agency, PrivateOwner, Tenant, PropertyManager


class PropertyFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    address = filters.CharFilter(method='filter_address')
    
    suburb = filters.CharFilter(field_name='suburb', lookup_expr='icontains')
    state = filters.CharFilter(field_name='state', lookup_expr='exact')
    postcode = filters.CharFilter(field_name='postcode', lookup_expr='exact')
    
    # Replace separate is_agency and is_private with single owner_type
    owner_type = filters.CharFilter(method='filter_owner_type')
    is_active = filters.BooleanFilter(field_name='is_active')
    
    agency = filters.ModelChoiceFilter(
        field_name='agency',
        queryset=Agency.objects.filter(is_active=True)
    )
    
    ordering = filters.OrderingFilter(
        fields=(
            ('street_name', 'street_name'),
            ('street_number', 'street_number'),
            ('suburb', 'suburb'),
            ('state', 'state'),
            ('postcode', 'postcode'),
            ('agency__name', 'agency_name'),
        ),
        field_labels={
            'street_name': 'Street Name',
            'street_number': 'Street Number',
            'suburb': 'Suburb',
            'state': 'State',
            'postcode': 'Postcode',
            'agency_name': 'Agency Name',
        }
    )
    
    def filter_search(self, queryset, name, value):
        """
        Search across property address, agency name, and private owner names
        """
        if not value:
            return queryset
            
        search_terms = value.split()
        q_objects = Q()
        
        for term in search_terms:
            term_q = (
                Q(street_name__icontains=term) |
                Q(street_number__icontains=term) |
                Q(suburb__icontains=term) |
                Q(unit_number__icontains=term) |
                Q(agency__name__icontains=term) |
                Q(private_owners__first_name__icontains=term) |
                Q(private_owners__last_name__icontains=term)
            )
            q_objects &= term_q
            
        return queryset.filter(q_objects).distinct()
    
    def filter_address(self, queryset, name, value):
        """
        Filter by specific property ID when an address is selected
        """
        if not value:
            return queryset
        
        # Check if value is a property ID (numeric)
        try:
            property_id = int(value)
            return queryset.filter(id=property_id)
        except (ValueError, TypeError):
            # Fall back to text-based search if not a valid ID
            search_terms = value.split()
            q_objects = Q()
            
            for term in search_terms:
                term_q = (
                    Q(street_name__icontains=term) |
                    Q(street_number__icontains=term) |
                    Q(suburb__icontains=term) |
                    Q(unit_number__icontains=term)
                )
                q_objects &= term_q
                
            return queryset.filter(q_objects).distinct()
    
    def filter_owner_type(self, queryset, name, value):
        """
        Filter by owner type: 'agency' or 'private'
        """
        if value == 'agency':
            return queryset.filter(is_agency=True)
        elif value == 'private':
            return queryset.filter(is_private=True)
        return queryset
    
    class Meta:
        model = Property
        fields = []


class AgencyFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    
    suburb = filters.CharFilter(field_name='suburb', lookup_expr='icontains')
    state = filters.CharFilter(field_name='state', lookup_expr='exact')
    is_active = filters.BooleanFilter(field_name='is_active')
    
    def filter_search(self, queryset, name, value):
        """
        Search across agency name, email, and address
        """
        if not value:
            return queryset
            
        return queryset.filter(
            Q(name__icontains=value) |
            Q(email__icontains=value) |
            Q(street_name__icontains=value) |
            Q(suburb__icontains=value)
        )
    
    class Meta:
        model = Agency
        fields = ['name', 'email', 'phone']


class TenantFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    
    def filter_search(self, queryset, name, value):
        """
        Search across tenant name, email, and phone
        """
        if not value:
            return queryset
            
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(email__icontains=value) |
            Q(phone__icontains=value)
        )
    
    class Meta:
        model = Tenant
        fields = ['first_name', 'last_name', 'email', 'phone'] 