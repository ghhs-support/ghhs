import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPinIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PropertyMapProps {
  latitude: string;
  longitude: string;
  address?: string;
  height?: string;
  className?: string;
}

export default function PropertyMap({ 
  latitude, 
  longitude, 
  address,
  height = "h-full",
  className = "" 
}: PropertyMapProps) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return (
      <div className={`${height} bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MapPinIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No map available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${height} rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            {address || 'Property Location'}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
} 