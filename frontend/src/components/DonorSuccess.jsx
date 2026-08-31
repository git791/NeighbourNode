import { CheckCircle2, RotateCcw } from 'lucide-react';

export function DonorSuccess({ onLogAnother }) {
  return (
    <div className="donor-success">
      <div className="donor-success__icon">
        <CheckCircle2 size={28} color="white" />
      </div>
      <div className="donor-success__content">
        <div className="donor-success__title">Donation logged successfully!</div>
        <p className="donor-success__text">
          Thank you for supporting your neighborhood. We've notified the host and a runner will be assigned shortly.
        </p>
        <button className="btn donor-success__btn" onClick={onLogAnother}>
          <RotateCcw size={14} /> Log Another Donation
        </button>
      </div>
    </div>
  );
}