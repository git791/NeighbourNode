import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Refrigerator } from 'lucide-react';
import { FridgeCard } from './FridgeCard.jsx';

const STATUS_COLORS = {
  stocked: '#2F6B4F',
  low: '#E7A93C',
  empty: '#E4531F',
  flagged: '#E4531F',
};

function createPinIcon(status) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.empty;

  const iconMarkup = renderToStaticMarkup(
    <div style={{ position: 'relative', width: '32px', height: '40px' }}>
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 0C7.163 0 0 7.163 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.163 24.837 0 16 0Z"
          fill={color}
        />
      </svg>
      <Refrigerator
        size={16}
        color="white"
        style={{ position: 'absolute', top: '8px', left: '8px' }}
      />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'fridge-pin',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
}

export function Map({ fridges = [] }) {
  const center = fridges.length > 0
    ? [
        fridges.reduce((s, f) => s + (f.lat || 40.68), 0) / fridges.length,
        fridges.reduce((s, f) => s + (f.lng || -73.96), 0) / fridges.length,
      ]
    : [40.68, -73.96];

  return (
    <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {fridges.map((fridge) => {
        if (!fridge.lat || !fridge.lng) return null;
        const status = fridge.status || 'empty';

        return (
          <Marker
            key={fridge.entity_id || fridge.id}
            position={[fridge.lat, fridge.lng]}
            icon={createPinIcon(status)}
          >
            <Popup maxWidth={260} className="fridge-popup">
              <FridgeCard fridge={fridge} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}