import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, Search } from "lucide-react";

import { INDUSTRY_OPTIONS } from "../../constants/industryOptions";

type IndustryMultiSelectProps = {
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export default function IndustryMultiSelect({
  selected,
  onChange,
  placeholder = "Select industries",
}: IndustryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const filteredOptions = useMemo(
    () =>
      INDUSTRY_OPTIONS.filter((option) =>
        option.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [search],
  );

  const allSelected = INDUSTRY_OPTIONS.every((option) => selected.includes(option));
  const label = selected.length ? selected.join(", ") : placeholder;

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }

    onChange([...selected, option]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : [...INDUSTRY_OPTIONS]);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div className="industry-multiselect" ref={rootRef}>
      <button
        type="button"
        className="industry-multiselect__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <Building2 size={18} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open && (
        <div className="industry-multiselect__menu">
          <label className="industry-multiselect__search">
            <Search size={15} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
            />
          </label>

          <label className="industry-multiselect__option">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>All</span>
          </label>

          <div className="industry-multiselect__list">
            {filteredOptions.map((option) => (
              <label className="industry-multiselect__option" key={option}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
