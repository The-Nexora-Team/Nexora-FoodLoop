/* SafetyChecklist — food safety verification form */

import './SafetyChecklist.css';

const ALLERGEN_OPTIONS = ['Dairy', 'Gluten', 'Nuts', 'Seafood', 'Eggs', 'Soy'];

export default function SafetyChecklist({ values, onChange }) {
  function handleCheckboxChange(field) {
    onChange({
      ...values,
      [field]: !values[field],
    });
  }

  function handleAllergenToggle(allergen) {
    const current = values.allergens || [];
    const updated = current.includes(allergen)
      ? current.filter((a) => a !== allergen)
      : [...current, allergen];
    onChange({
      ...values,
      allergens: updated,
    });
  }

  return (
    <div className="safety-checklist">
      <div className="safety-header">
        <h4>🛡️ Food Safety & Hygiene Verification</h4>
        <p>Ensure regulatory compliance before food can enter the recovery loop.</p>
      </div>

      <div className="safety-item">
        <label className="safety-label">
          <input
            type="checkbox"
            checked={values.keptHotOrChilled || false}
            onChange={() => handleCheckboxChange('keptHotOrChilled')}
          />
          <span>Food temperature strictly maintained: Hot (&gt;60°C) or Chilled (&lt;5°C)</span>
        </label>
      </div>

      <div className="safety-item">
        <label className="safety-label">
          <input
            type="checkbox"
            checked={values.cleanPackaging || false}
            onChange={() => handleCheckboxChange('cleanPackaging')}
          />
          <span>Packed in clean, food-grade, tamper-evident containers</span>
        </label>
      </div>

      <div className="safety-allergens-section">
        <label className="section-title">Declared Allergens:</label>
        <div className="allergen-pills">
          {ALLERGEN_OPTIONS.map((alg) => {
            const active = (values.allergens || []).includes(alg);
            return (
              <button
                key={alg}
                type="button"
                className={`allergen-pill ${active ? 'active' : ''}`}
                onClick={() => handleAllergenToggle(alg)}
              >
                {active ? '✓ ' : '+ '} {alg}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
