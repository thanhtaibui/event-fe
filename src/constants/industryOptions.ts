export const INDUSTRY_OTHER_VALUE = "Other";

export const INDUSTRY_OPTIONS = [
  "Technology",
  "Education",
  "Business",
  "Finance",
  "Healthcare",
  "Music",
  "Sports",
  "Art & Culture",
  "Entertainment",
  "Food & Beverage",
  "Travel & Hospitality",
  "Community",
  "Nonprofit",
  INDUSTRY_OTHER_VALUE,
] as const;

export function parseIndustryValue(value?: string | null) {
  if (!value) return { selected: [] as string[], other: "" };

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const standardOptions = new Set<string>(INDUSTRY_OPTIONS);
  const selected = parts.filter((part) => standardOptions.has(part));
  const customParts = parts.filter((part) => !standardOptions.has(part));

  if (customParts.length && !selected.includes(INDUSTRY_OTHER_VALUE)) {
    selected.push(INDUSTRY_OTHER_VALUE);
  }

  return {
    selected,
    other: customParts.join(", "),
  };
}

export function buildIndustryValue(selected: string[], other: string) {
  const cleanSelected = selected.filter((item) => item !== INDUSTRY_OTHER_VALUE);
  const cleanOther = other.trim();

  return [...cleanSelected, cleanOther].filter(Boolean).join(", ");
}
