import { useState } from 'react';

export function DonorForm({ fridges = [], onSubmit }) {
  const [formData, setFormData] = useState({
    donor_name: '',
    food_type: '',
    quantity: '',
    fridge_id: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setSubmitted(true);
    setFormData({ donor_name: '', food_type: '', quantity: '', fridge_id: '', notes: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <form className="donor-form" onSubmit={handleSubmit}>
      <h2>Log a Donation</h2>

      <label>
        Your name / organization
        <input
          type="text"
          name="donor_name"
          value={formData.donor_name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Food type
        <input
          type="text"
          name="food_type"
          placeholder="e.g. Bread, Vegetables"
          value={formData.food_type}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Quantity
        <input
          type="text"
          name="quantity"
          placeholder="e.g. 12 loaves, 3 boxes"
          value={formData.quantity}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Which fridge?
        <select
          name="fridge_id"
          value={formData.fridge_id}
          onChange={handleChange}
          required
        >
          <option value="">Select a fridge</option>
          {fridges.map((f) => (
            <option key={f.entity_id} value={f.entity_id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Notes (optional)
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />
      </label>

      <button type="submit" className="btn btn--approve">
        Log Donation
      </button>

      {submitted && <div className="donor-form__success">Thanks! Your donation has been logged.</div>}
    </form>
  );
}