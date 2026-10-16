import { useEffect, useRef, useState } from "react";

const VIETMAP_KEY = "371b22709ec99c49f3653060065b20b4688e22044f075f41";

interface PlaceInputProps {
  value: string;
  onChange: (value: string) => void;
}

type VietMapSuggestion = {
  ref_id?: string;
  display?: string;
  name?: string;
  address?: string;
};

type SelectedPlace = {
  displayValue: string;
  raw: VietMapSuggestion;
};

function getSuggestionDisplay(suggestion: VietMapSuggestion) {
  return suggestion.display || suggestion.address || suggestion.name || "";
}

export function PlaceInput({ value, onChange }: PlaceInputProps) {
  const [suggestions, setSuggestions] = useState<VietMapSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
  const [isPlaceLoading, setIsPlaceLoading] = useState(false);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (!isPlaceDropdownOpen) return;

    if (selectedPlace && value === selectedPlace.displayValue) {
      setSuggestions([]);
      setIsPlaceLoading(false);
      return;
    }

    if (!value || value.trim().length < 4) {
      setSuggestions([]);
      setIsPlaceLoading(false);
      return;
    }

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setIsPlaceLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://maps.vietmap.vn/api/autocomplete/v3?apikey=${VIETMAP_KEY}&text=${encodeURIComponent(value)}&focus=10.762622,106.660172`,
        );
        const data = await res.json();
        if (requestSeqRef.current === requestSeq) {
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch {
        if (requestSeqRef.current === requestSeq) {
          setSuggestions([]);
        }
      } finally {
        if (requestSeqRef.current === requestSeq) {
          setIsPlaceLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [isPlaceDropdownOpen, selectedPlace, value]);

  return (
    <div style={{ position: "relative" }}>
      <input
        name="place"
        placeholder="Enter event location..."
        value={value}
        onChange={(e) => {
          const nextValue = e.target.value;
          if (selectedPlace && nextValue !== selectedPlace.displayValue) {
            setSelectedPlace(null);
          }
          setIsPlaceDropdownOpen(true);
          onChange(nextValue);
        }}
        onFocus={() => {
          if (!selectedPlace || value !== selectedPlace.displayValue) {
            setIsPlaceDropdownOpen(true);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setIsPlaceDropdownOpen(false);
          }, 160);
        }}
        autoComplete="off"
        style={{ width: "100%" }}
      />
      {isPlaceDropdownOpen && (isPlaceLoading || suggestions.length > 0) && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            marginTop: 4,
            padding: 4,
            listStyle: "none",
            zIndex: 9999,
            maxHeight: 200,
            overflowY: "auto",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {isPlaceLoading && suggestions.length === 0 && (
            <li
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Đang tìm địa điểm...
            </li>
          )}
          {suggestions.map((s) => (
            <li
              key={s.ref_id || getSuggestionDisplay(s)}
              onMouseDown={() => {
                const displayValue = getSuggestionDisplay(s);
                setSelectedPlace({ displayValue, raw: s });
                onChange(displayValue);
                setSuggestions([]);
                setIsPlaceDropdownOpen(false);
                setIsPlaceLoading(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                borderRadius: 8,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f5f3ff")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#7C5CFC"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M7 1C4.79 1 3 2.79 3 5c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z" />
                <circle cx="7" cy="5" r="1.5" />
              </svg>
              {getSuggestionDisplay(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
