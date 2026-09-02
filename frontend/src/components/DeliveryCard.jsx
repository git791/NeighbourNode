import { ArrowRight, Truck, MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_PILL = {
  active: 'Active',
  pending: 'Pending',
  completed: 'Completed',
};

export function DeliveryCard({ dispatch, donorName, fridgeName, fridgeAddress, onComplete, completing }) {
  const isCompleted = dispatch.status === 'completed';

  return (
    <div className={`delivery-card ${isCompleted ? 'delivery-card--completed' : ''}`}>
      <div className="delivery-card__avatar">🧺</div>

      <div className="delivery-card__main">
        <div className="delivery-card__title">
          {dispatch.offer_id} <ArrowRight size={14} /> {fridgeName}
        </div>
        <div className="delivery-card__meta">
          <Truck size={13} /> From donor: {donorName}
        </div>
        {fridgeAddress && (
          <div className="delivery-card__meta">
            <MapPin size={13} /> {fridgeAddress}
          </div>
        )}
      </div>

      <div className="delivery-card__timing">
        <span className="delivery-card__status-dot">
          <span className={`status-dot status-dot--${dispatch.status}`} />
          {STATUS_PILL[dispatch.status] || dispatch.status}
        </span>
        {dispatch.created_at && (
          <div className="delivery-card__meta">
            <Calendar size={13} /> Started<br />
            {new Date(dispatch.created_at).toLocaleString()}
          </div>
        )}
      </div>

      <div className="delivery-card__actions">
        {!isCompleted && (
          <button
            className="btn btn--approve delivery-card__btn"
            onClick={() => onComplete(dispatch.dispatch_id)}
            disabled={completing}
          >
            <CheckCircle2 size={15} /> {completing ? 'Marking…' : 'Mark as Delivered'}
          </button>
        )}
        <button className="btn delivery-card__btn-outline">View details</button>
      </div>
    </div>
  );
}