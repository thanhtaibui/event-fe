import { useEffect } from "react";
import { TextField, InputAdornment, Box, Button } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useSearchFilter } from "../../hooks/table/useSearchBar";
import "../../styles/index.css";
interface Props {
  onSearchChange: (value: string) => void;
  onCreate?: () => void;
  title: string;
}

export const SearchBar = ({ onSearchChange, onCreate, title }: Props) => {
  const { searchQuery, debouncedSearchQuery, handleSearchChange } =
    useSearchFilter();
  // Chỉ bắn event ra ngoài khi debouncedText thực sự thay đổi
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
      <TextField
        size="small"
        placeholder="Search ..."
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
