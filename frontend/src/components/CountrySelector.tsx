import { useEffect, useState } from "react";
import { fetchCountries } from "../api/client";

interface Props {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
}

// Map country names to their flag emojis
const countryFlags: Record<string, string> = {
  // North America
  Canada: "🇨🇦",
  Mexico: "🇲🇽",
  "United States": "🇺🇸",
  "Costa Rica": "🇨🇷",
  Panama: "🇵🇦",
  Jamaica: "🇯🇲",
  Honduras: "🇭🇳",

  // South America
  Argentina: "🇦🇷",
  Brazil: "🇧🇷",
  Uruguay: "🇺🇾",
  Colombia: "🇨🇴",
  Ecuador: "🇪🇨",
  Paraguay: "🇵🇾",
  Chile: "🇨🇱",
  Peru: "🇵🇪",
  Bolivia: "🇧🇴",
  Venezuela: "🇻🇪",

  // Europe
  France: "🇫🇷",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Spain: "🇪🇸",
  Germany: "🇩🇪",
  Portugal: "🇵🇹",
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Belgium: "🇧🇪",
  Croatia: "🇭🇷",
  Switzerland: "🇨🇭",
  Denmark: "🇩🇰",
  Poland: "🇵🇱",
  Serbia: "🇷🇸",
  Austria: "🇦🇹",
  Turkey: "🇹🇷",
  Norway: "🇳🇴",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",

  // Asia
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  Australia: "🇦🇺",
  Iran: "🇮🇷",
  "Saudi Arabia": "🇸🇦",
  Qatar: "🇶🇦",

  // Africa
  Morocco: "🇲🇦",
  Senegal: "🇸🇳",
  Tunisia: "🇹🇳",
  Cameroon: "🇨🇲",
  Ghana: "🇬🇭",
  Nigeria: "🇳🇬",
  Egypt: "🇪🇬",
  Algeria: "🇩🇿",
  "Ivory Coast": "🇨🇮",
  "South Africa": "🇿🇦",
};

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
    <div className="country-selector">
      <span className="country-selector__label">
        Pick a country qualified for World Cup 2026:
      </span>
      <div className="country-grid">
        {countries.map((country) => (
          <button
            key={country}
            type="button"
            className={`country-button ${value === country ? "country-button--selected" : ""}`}
            onClick={() => onChange(value === country ? "" : country)}
            disabled={disabled}
            aria-pressed={value === country}
          >
            <span className="country-button__flag" aria-hidden="true">
              {countryFlags[country] || "🏳️"}
            </span>
            <span className="country-button__name">{country}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
