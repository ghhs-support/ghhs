from django.db.models import Q
from typing import List, Dict, Any, Optional
from django.db.models.query import QuerySet

def apply_search_filter(queryset: QuerySet, 
                       search_term: Optional[str], 
                       search_fields: List[str],
                       exact_fields: List[str] = None) -> QuerySet:
    """
    Apply search filter to a queryset based on search term and fields.
    
    Args:
        queryset: The base queryset to filter
        search_term: The search term to filter by
        search_fields: List of fields to search (using contains)
        exact_fields: List of fields to match exactly
    
    Returns:
        Filtered queryset
    """
    if not search_term:
        return queryset

    search_terms = search_term.strip().split()
    q_objects = Q()

    for term in search_terms:
        # Handle contains (partial match) fields
        for field in search_fields:
            q_objects |= Q(**{f"{field}__icontains": term})
        
        # Handle exact match fields
        if exact_fields:
            for field in exact_fields:
                q_objects |= Q(**{f"{field}__iexact": term})

    return queryset.filter(q_objects).distinct()

def apply_date_filters(queryset: QuerySet,
                      date_field: str,
                      date_from: Optional[str] = None,
                      date_to: Optional[str] = None,
                      date_exact: Optional[str] = None) -> QuerySet:
    """
    Apply date-based filters to a queryset.
    
    Args:
        queryset: The base queryset to filter
        date_field: The name of the date field to filter on
        date_from: Start date (inclusive)
        date_to: End date (inclusive)
        date_exact: Exact date match
    
    Returns:
        Filtered queryset
    """
    if date_exact:
        try:
            return queryset.filter(**{date_field: date_exact})
        except ValueError:
            return queryset

    if date_from:
        try:
            queryset = queryset.filter(**{f"{date_field}__gte": date_from})
        except ValueError:
            pass

    if date_to:
        try:
            queryset = queryset.filter(**{f"{date_field}__lte": date_to})
        except ValueError:
            pass

    return queryset

def apply_boolean_filters(queryset: QuerySet,
                         filters: Dict[str, Any]) -> QuerySet:
    """
    Apply boolean filters to a queryset.
    
    Args:
        queryset: The base queryset to filter
        filters: Dictionary of field names and their boolean values
    
    Returns:
        Filtered queryset
    """
    for field, value in filters.items():
        if value is not None:
            if isinstance(value, str):
                value = value.lower() == 'true'
            queryset = queryset.filter(**{field: value})
    
    return queryset 