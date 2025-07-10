import django_filters as filters
from django.db.models import Q


class SearchFilterMixin:
    """
    Mixin that provides common search functionality
    """
    
    def multi_field_search(self, queryset, search_fields, value):
        """
        Generic multi-field search that can be used across different models
        
        Args:
            queryset: The queryset to filter
            search_fields: List of field names to search across
            value: The search term
            
        Returns:
            Filtered queryset
        """
        if not value:
            return queryset
            
        search_terms = value.split()
        q_objects = Q()
        
        for term in search_terms:
            term_q = Q()
            for field in search_fields:
                term_q |= Q(**{f"{field}__icontains": term})
            q_objects &= term_q
            
        return queryset.filter(q_objects).distinct()


class ActiveRecordFilterMixin:
    """
    Mixin that provides is_active filtering for models that have it
    """
    
    def get_active_filter(self):
        """
        Returns a BooleanFilter for is_active field
        """
        return filters.BooleanFilter(field_name='is_active')


class DateRangeFilterMixin:
    """
    Mixin that provides date range filtering functionality
    """
    
    def get_date_range_filters(self, date_field='created_at'):
        """
        Returns from/to date filters for a given field
        
        Args:
            date_field: The field name to filter on (default: 'created_at')
            
        Returns:
            Dictionary with from/to filters
        """
        return {
            f'{date_field}_from': filters.DateTimeFilter(
                field_name=date_field,
                lookup_expr='gte'
            ),
            f'{date_field}_to': filters.DateTimeFilter(
                field_name=date_field,
                lookup_expr='lte'
            )
        }


class CommonOrderingMixin:
    """
    Mixin that provides common ordering fields
    """
    
    def get_common_ordering_fields(self):
        """
        Returns common ordering fields that most models have
        """
        return (
            ('created_at', 'created_at'),
            ('updated_at', 'updated_at'),
        )


class AddressFilterMixin:
    """
    Mixin that provides address-related filtering
    """
    
    def get_address_filters(self):
        """
        Returns common address filters
        """
        return {
            'suburb': filters.CharFilter(field_name='suburb', lookup_expr='icontains'),
            'state': filters.CharFilter(field_name='state', lookup_expr='exact'),
            'postcode': filters.CharFilter(field_name='postcode', lookup_expr='exact'),
        }
    
    def filter_address_search(self, queryset, name, value):
        """
        Search across address fields
        """
        if not value:
            return queryset
            
        return queryset.filter(
            Q(street_number__icontains=value) |
            Q(street_name__icontains=value) |
            Q(suburb__icontains=value) |
            Q(state__icontains=value) |
            Q(postcode__icontains=value) |
            Q(unit_number__icontains=value)
        ) 