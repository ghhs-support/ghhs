from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that can be reused across the project.
    Supports configurable page sizes and returns results in a consistent format.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 200
    page_query_param = 'page'

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
        })

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