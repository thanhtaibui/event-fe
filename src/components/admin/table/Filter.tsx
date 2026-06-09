import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Typography,
  Box,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface FilterOption {
  label: string;
  value: string;
  color?: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (val: string) => void;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: FilterDropdownProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        variant="outlined"
        size="large"
        startIcon={<FilterListIcon sx={{ width: 14 }} />}
        endIcon={<KeyboardArrowDownIcon sx={{ width: 14 }} />}
        sx={{
          borderRadius: 2,
          borderColor: value ? "#7C5CFC" : "divider",
          color: value ? "#7C5CFC" : "text.secondary",
          background: value ? "#F5F3FF" : "#ffff",
          fontSize: 14,
          textTransform: "none",
        }}
      >
        {label}
        {selected && (
          <Chip
            label={selected.label}
            size="small"
            sx={{
              ml: 0.5,
              height: 18,
              fontSize: 11,
              background: "#EEF0FF",
              color: "#4F46DC",
            }}
          />
        )}
      </Button>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              border: "0.5px solid",
              borderColor: "divider",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              minWidth: 180,
            },
          },
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            color: "text.secondary",
            px: 1.5,
            py: 0.5,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Typography>
        <Divider sx={{ my: 0.5 }} />
        {options.map((opt) => (
          <MenuItem
            key={opt.value}
            selected={opt.value === value}
            onClick={() => {
              onChange(opt.value);
              setAnchor(null);
            }}
            sx={{
              fontSize: 13,
              borderRadius: 1,
              mx: 0.5,
              gap: 1,
              "&.Mui-selected": { background: "#F5F3FF", color: "#7C5CFC" },
            }}
          >
            {opt.color && (
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: opt.color,
                  flexShrink: 0,
                }}
              />
            )}
            {opt.label}
          </MenuItem>
        ))}
        {value && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => {
                onChange("");
                setAnchor(null);
              }}
              sx={{
                fontSize: 12,
                color: "error.main",
                borderRadius: 1,
                mx: 0.5,
              }}
            >
              Clear
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
