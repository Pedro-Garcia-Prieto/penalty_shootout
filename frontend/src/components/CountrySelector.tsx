import { useEffect, useState } from "react";
import { fetchCountries } from "../api/client";

interface Props {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
}

export function CountrySelector({ value, onChange, disabled }: Props) {
  const [countries, setCountries] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch((err) => setLoadError(err.detail ?? "Failed to load countries"));
  }, []);

  if (loadError) {
    return (
      <p role="alert" className="error">
        {loadError}
      </p>
    );
  }

  return (
    <label className="country-selector">
      <span>Pick a country qualified for World Cup 2026:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || countries.length === 0}
      >
        <option value="">— Select a country —</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
