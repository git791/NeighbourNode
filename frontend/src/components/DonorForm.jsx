import { useState } from 'react';
import { User, UtensilsCrossed, Scale, Refrigerator, FileText, Package } from 'lucide-react';

export function DonorForm({ fridges = [], onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    donor_name: '',
    food_type: '',
    quantity: '',
    fridge_id: '',
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmitSuccess(formData);
    setFormData({ donor_name: '', food_type: '', quantity: '', fridge_id: '', notes: '' });
  };

  return (
    <div className="donor-form-card">
      <div className="donor-form-card__header">
        <div className="donor-form-card__icon">🧺</div>
        <div>
          <h2 className="donor-form-card__title">Log a Donation</h2>
          <p className="donor-form-card__subtitle">
            Thank you for helping keep our community fridges stocked. Every donation makes a difference. ❤️
          </p>
        </div>
      </div>

      <form className="donor-form" onSubmit={handleSubmit}>
        <label className="donor-form__field">
          <span className="donor-form__label"><User size={16} /> Your name / organization</span>
          <input
            type="text"
            name="donor_name"
            placeholder="e.g. Green Bites Restaurant"
            value={formData.donor_name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="donor-form__field">
          <span className="donor-form__label"><UtensilsCrossed size={16} /> Food type</span>
          <input
            type="text"
            name="food_type"
            placeholder="e.g. Pasta, Bread, Vegetables"
            value={formData.food_type}
            onChange={handleChange}
            required
          />
        </label>

        <label className="donor-form__field">
          <span className="donor-form__label"><Scale size={16} /> Quantity</span>
          <input
            type="text"
            name="quantity"
            placeholder="e.g. 5 kg, 3 packs, 20 pieces"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </label>

        <label className="donor-form__field">
          <span className="donor-form__label"><Refrigerator size={16} /> Which fridge?</span>
          <select name="fridge_id" value={formData.fridge_id} onChange={handleChange} required>
            <option value="">Select a fridge</option>
            {fridges.map((f) => (
              <option key={f.entity_id} value={f.entity_id}>{f.name}</option>
            ))}
          </select>
        </label>

        <label className="donor-form__field">
          <span className="donor-form__label"><FileText size={16} /> Notes (optional)</span>
          <textarea
            name="notes"
            placeholder="Any additional details (e.g. expiry date, ingredients, special instructions)"
            value={formData.notes}
            onChange={handleChange}
          />
        </label>

        <button type="submit" className="btn btn--approve donor-form__submit">
          <Package size={16} /> Log Donation
        </button>
      </form>
    </div>
  );
}