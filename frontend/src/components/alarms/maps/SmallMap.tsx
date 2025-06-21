import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fixLeafletIcon } from '../../../utils/leaflet';

interface SmallMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export default function SmallMap({ latitude, longitude, className = '' }: SmallMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix Leaflet's default icon
    fixLeafletIcon();

    if (mapContainerRef.current && latitude && longitude && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        attributionControl: false,
        scrollWheelZoom: false,
        zoomControl: false
      }).setView([latitude, longitude], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      L.marker([latitude, longitude]).addTo(mapInstanceRef.current);

      // Force a resize after a short delay to ensure proper rendering
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer overflow-hidden ${className}`}
    />
  );
} 