import requests
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status

class GooglePlacesAPI:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    def autocomplete_address(self, input_text, country_code):
        url = f"{self.base_url}/autocomplete/json"
        params = {
            "input": input_text,
            "key": self.api_key,
            "components": f"country:{country_code}",
            "types": "geocode"
        }
    
        response = requests.get(url, params=params)
        return response.json()

    def get_place_details(self, place_id):
        url = f"{self.base_url}/details/json"
        params = {
            "place_id": place_id,
            "fields": "geometry,formatted_address,address_components",
            "key": self.api_key
        }
        response = requests.get(url, params=params)
        return response.json()

    