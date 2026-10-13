import { MinusIcon, PlusIcon } from './Icons.jsx';

export function QuantityStepper({ value, min = 1, max, onChange, disabled, label = 'Quantity' }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
