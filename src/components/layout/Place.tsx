import { useState, useEffect } from "react";

const VIETMAP_KEY = "371b22709ec99c49f3653060065b20b4688e22044f075f41";

interface PlaceInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PlaceInput({ value, onChange }: PlaceInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!value || value.length < 4) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://maps.vietmap.vn/api/autocomplete/v3?apikey=${VIETMAP_KEY}&text=${encodeURIComponent(value)}&focus=10.762622,106.660172`,
        );
        const data = await res.json();
        // console.log(data);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div style={{ position: "relative" }}>
      <input
        name="place"
        placeholder="Enter event location..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTimeout(() => setSuggestions([]), 200)}
        autoComplete="off"
        style={{ width: "100%" }}
      />
      {suggestions.length > 0 && (
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
          {suggestions.map((s: any) => (
            <li
              key={s.ref_id}
              onMouseDown={() => {
                onChange(s.display);
                setSuggestions([]);
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
              {s.display}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
