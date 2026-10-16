import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export type EventFilterDropdownOption = {
  value: string;
  label: string;
};

type EventFilterDropdownProps = {
  label: string;
  value: string;
  options: EventFilterDropdownOption[];
  onChange: (value: string) => void;
  Icon: LucideIcon;
};

export default function EventFilterDropdown({
  label,
  value,
  options,
  onChange,
  Icon,
}: EventFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`event-filterDropdown${open ? " event-filterDropdown--open" : ""}`}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="event-filterDropdown__trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="event-filterDropdown__icon" aria-hidden="true">
          <Icon size={14} />
        </span>
        <span className="event-filterDropdown__copy">
          <span className="event-filterDropdown__label">{label}</span>
          <strong className="event-filterDropdown__value">{selectedOption?.label || "All"}</strong>
        </span>
        <ChevronDown className="event-filterDropdown__chevron" size={14} aria-hidden="true" />
      </button>

      {open && (
        <div className="event-filterDropdown__menu" role="listbox" aria-label={label}>
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                aria-selected={selected}
                className={`event-filterDropdown__option${
                  selected ? " event-filterDropdown__option--selected" : ""
                }`}
                key={option.value || option.label}
                role="option"
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {selected && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
