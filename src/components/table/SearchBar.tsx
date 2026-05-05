import { useEffect, useState } from "react";
import { TextField, InputAdornment, Box, Button } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useSearchFilter } from "../../hooks/table/useSearchBar";
import "../../styles/index.css";
import { FilterDropdown } from "./Filter";
interface Props {
  onSearchChange: (value: string) => void;
  onCreate?: () => void;
  title: string;
  placeholder: string[];
  filters?: FilterConfig[];
  onFilterChange?: (key: string, value: string) => void;
}
interface FilterConfig {
  key: string; // "status", "role"...
  placeholder: string;
  options: { label: string; value: string }[];
}
export const SearchBar = ({
  onSearchChange,
  onCreate,
  title,
  filters,
  placeholder,
  onFilterChange,
}: Props) => {
  const { searchQuery, debouncedSearchQuery, handleSearchChange } =
    useSearchFilter();
  // Chỉ bắn event ra ngoài khi debouncedText thực sự thay đổi
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    onFilterChange?.(key, value);
  };
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TextField
          sx={{
            width: {
              xs: "100%",
              sm: "250px",
              md: "400px",
            },
          }}
          size="small"
          placeholder={`Search by ${placeholder}...`}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Render nhiều filter */}
        {filters?.map((f) => (
          <FilterDropdown
            key={f.key}
            label={f.placeholder}
            options={f.options}
            value={filterValues[f.key] ?? ""}
            onChange={(val) => handleFilterChange(f.key, val)}
          />
        ))}
      </Box>

      {onCreate && (
        <Button className="btn-create" variant="contained" onClick={onCreate}>
          <span className="icon-create">
            <img
              width="25"
              height="25"
              src={
                title === "user"
                  ? "https://img.icons8.com/ios-glyphs/30/add-user-male.png"
                  : "https://img.icons8.com/ios-glyphs/30/add.png"
              }
              alt="add"
            />
          </span>
          <span className="text-create">Create</span>
        </Button>
      )}
    </Box>
  );
};
