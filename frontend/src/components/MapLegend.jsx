export function MapLegend() {
  return (
    <div className="map-legend">
      <div className="map-legend__item">
        <span className="map-legend__dot map-legend__dot--stocked" />
        Well Stocked
      </div>
      <div className="map-legend__item">
        <span className="map-legend__dot map-legend__dot--low" />
        Running Low
      </div>
      <div className="map-legend__item">
        <span className="map-legend__dot map-legend__dot--empty" />
        Needs Help
      </div>
      <div className="map-legend__divider" />
      <div className="map-legend__item map-legend__item--muted">
        <span className="map-legend__dot map-legend__dot--updated" />
        Updated just now
      </div>
    </div>
  );
}