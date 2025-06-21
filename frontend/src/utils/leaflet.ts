import L from 'leaflet';

// Fix Leaflet's default marker icon issue
const fixLeafletIcon = () => {
  // Get the images path from the Leaflet CSS
  const getImageUrl = (name: string) => {
    return `https://unpkg.com/leaflet@1.7.1/dist/images/${name}`;
  };

  // Delete the default icon
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  // Set up the new default icon
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: getImageUrl('marker-icon-2x.png'),
    iconUrl: getImageUrl('marker-icon.png'),
    shadowUrl: getImageUrl('marker-shadow.png'),
  });
};

export { fixLeafletIcon }; 