import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fixLeafletIcon } from '../../../utils/leaflet';
import { Modal } from '../../ui/modal';

interface MapViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  title?: string;
}

export default function MapViewerModal({ isOpen, onClose, latitude, longitude, title = 'Map View' }: MapViewerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix Leaflet's default icon
    fixLeafletIcon();

    if (isOpen && mapContainerRef.current && latitude && longitude && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        attributionControl: false
      }).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className="flex flex-col">
        <div className="mb-6">
          <h5 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h5>
        </div>
        <div className="h-[60vh] w-full" ref={mapContainerRef}>
          {/* Map will be rendered here */}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Use scroll wheel to zoom, drag to pan.
        </p>
      </div>
    </Modal>
  );
} 