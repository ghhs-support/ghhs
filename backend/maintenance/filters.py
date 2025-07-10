import django_filters as filters
from django.db.models import Q
from django.contrib.auth.models import User
from .models import BeepingAlarm, IssueType
from properties.models import Property


class BeepingAlarmFilter(filters.FilterSet):
    status = filters.CharFilter(field_name='status', lookup_expr='exact')
    
    is_customer_contacted = filters.BooleanFilter(field_name='is_customer_contacted')
    
    property = filters.ModelChoiceFilter(
        field_name='property',
        queryset=Property.objects.all()
    )
    
    allocation = filters.ModelChoiceFilter(
        field_name='allocation',
        queryset=User.objects.all()
    )
    
    tenant = filters.NumberFilter(field_name='property__tenants__id')
    
    issue_type = filters.ModelChoiceFilter(
        field_name='issue_type',
        queryset=IssueType.objects.filter(is_active=True)
    )
    
    created_at_from = filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    
    created_at_to = filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    
    search = filters.CharFilter(method='filter_search')
    
    agency_private = filters.ChoiceFilter(
        choices=[('agency', 'Agency'), ('private', 'Private')],
        method='filter_agency_private'
    )
    
    ordering = filters.OrderingFilter(
        fields=(
            ('created_at', 'created_at'),
            ('updated_at', 'updated_at'),
            ('status', 'status'),
            ('is_customer_contacted', 'customer_contacted'),
            ('allocation__first_name', 'allocation'),
            ('property__street_name', 'property'),
        ),
        field_labels={
            'created_at': 'Date Created',
            'updated_at': 'Date Updated',
            'status': 'Status',
            'customer_contacted': 'Customer Contacted',
            'allocation': 'Allocation',
            'property': 'Property',
        }
    )
    
    def filter_search(self, queryset, name, value):
        """
        Custom search filter that searches across multiple fields
        """
        if not value:
            return queryset
            
        search_terms = value.split()
        q_objects = Q()
        
        for term in search_terms:
            term_q = (
                Q(notes__icontains=term) |
                Q(property__street_number__icontains=term) |
                Q(property__street_name__icontains=term) |
                Q(property__suburb__icontains=term) |
                Q(property__state__icontains=term) |
                Q(property__postcode__icontains=term) |
                Q(allocation__first_name__icontains=term) |
                Q(allocation__last_name__icontains=term) |
                Q(allocation__username__icontains=term) |
                Q(issue_type__name__icontains=term)
            )
            q_objects &= term_q
            
        return queryset.filter(q_objects).distinct()
    
    def filter_agency_private(self, queryset, name, value):
        """
        Filter by agency or private properties
        """
        if value == 'agency':
            return queryset.filter(property__is_agency=True)
        elif value == 'private':
            return queryset.filter(property__is_private=True)
        return queryset
    
    class Meta:
        model = BeepingAlarm
        fields = [] 