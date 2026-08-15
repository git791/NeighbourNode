import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FridgeCard } from './FridgeCard.jsx';

const STATUS_COLORS = {
  stocked: '#2F6B4F',
  low: '#E7A93C',
  empty: '#E4531F',
  flagged: '#E4531F',
};

const STATUS_FILL_OPACITY = {
  stocked: 1,
  low: 0.6,
  empty: 0,  // hollow ring
  flagged: 0,
};

export function Map({ fridges = [] }) {
  // Default center: Brooklyn, NYC
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
        const status = fridge.status || 'empty';
        const color = STATUS_COLORS[status] || STATUS_COLORS.empty;
        const fillOpacity = STATUS_FILL_OPACITY[status] ?? 0;

        if (!fridge.lat || !fridge.lng) return null;

        return (
          <CircleMarker
            key={fridge.entity_id || fridge.id}
            center={[fridge.lat, fridge.lng]}
            radius={12}
            pathOptions={{
              color: color,
              weight: 3,
              fillColor: color,
              fillOpacity: fillOpacity,
            }}
          >
            <Popup maxWidth={240} className="fridge-popup">
              <FridgeCard fridge={fridge} />
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
