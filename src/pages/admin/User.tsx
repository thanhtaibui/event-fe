import "../../styles/admin/btn-action.css";
import "../../styles/layout/table.css";

import type { User } from "../../types/user/user";
import LoadingPage from "../../pages/LoadingPage";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ROLE_COLOR_PALETTE } from "../../styles/status-styles";
// import component
import { IOSSwitch } from "../../components/admin/table/Switch";
import { SearchBar } from "../../components/admin/table/SearchBar";
import { CreateUserPopup } from "../../components/admin/user/createUser";
import Pagination from "../../components/admin/table/Pagination";
import CustomTable from "../../components/admin/table/Table";
import type { Column } from "../../components/admin/table/Table";
import { PopupHideItems } from "../../components/admin/layout/PopupHideItems";
import ConfirmDialog from "../../components/admin/layout/DialogConfirm";
//  hook
import { useDataTable } from "../../hooks/admin/useDataTable";
import { useUser } from "../../hooks/admin/user/useUser";
import { userService } from "../../services/admin/user.service";
import { usePageActions } from "../../hooks/admin/usePageActions";
import { useDelete } from "../../hooks/admin/user/useDelete";
import { UpdateUserPopup } from "../../components/admin/user/updateUser";

export default function User() {
  // useatate ẩn hiện

  const { data, loading, search, filter, table, pagination, actions, refetch } =
    useDataTable<User>({
      fetchHook: useUser,
      updateApi: userService.updateActive,
    });
  const { deleteSort } = useDelete();
  const {
    popupType,
    setPopupType,
    onFinalDelete,
    selectedIds,
    handleCloseAndClear,
    handleOpenConfirm,
    setSelectedIds,
  } = usePageActions(refetch, table, deleteSort);

  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };

  // setup column
  const userColumns: Column<User>[] = [
    { id: "fullName", label: "FullName", sortable: true },
    { id: "email", label: "Email", sortable: true },
    {
      id: "role",
      label: "Role of Org",
      render: (row: User) => {
        const roles = Array.isArray(row.role)
          ? row.role
          : row.role
            ? [row.role]
            : [];

        if (roles.length === 0) {
          const guestStyle = ROLE_COLOR_PALETTE.gray;
          return (
            <span
              className="role-badge"
              style={{
                background: guestStyle.bg,
                color: guestStyle.text,
                border: guestStyle.border,
              }}
            >
              GUEST
            </span>
          );
        }
        return (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {roles.map((role, index) => {
              const style =
                ROLE_COLOR_PALETTE[
                  role.colorKey as keyof typeof ROLE_COLOR_PALETTE
                ] || ROLE_COLOR_PALETTE.gray;
              return (
                <span
                  key={index}
                  className={`role-badge`}
                  style={{
                    background: style.bg,
                    color: style.text,
                    border: style.border,
                  }}
                >
                  {role.role_name} of {role.orgName}
                </span>
              );
            })}
          </div>
        );
      },
      sortable: false,
    },
    {
      id: "isActive",
      label: "Active",
      render: (user) => (
        <FormControlLabel
          control={
            <IOSSwitch
              sx={{ m: 1 }}
              checked={user.isActive}
              disabled={actions.isUpdating}
              onChange={(e) =>
                actions.toggleActive?.(user.id, e.target.checked)
              }
            />
          }
          label=""
        />
      ),
      sortable: false,
    },
    {
      id: "actions",
      label: "Actions",
      render: (user) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn-edit"
            onClick={() => {
              setPopupType("update");
              setSelectedIds([user.id]);
            }}
          >
            <img
              width="20"
              height="20"
              className="icon-white"
              src="https://img.icons8.com/nolan/64/pencil.png"
              alt="pencil"
            />
            <span className="text-edit">Edit</span>
          </button>
          <button
            className="btn-delete"
            onClick={() => {
              setPopupType("confirm");
              setSelectedIds([user.id]);
            }}
          >
            <img
              width="20"
              height="20"
              className="icon-white"
              src="https://img.icons8.com/nolan/64/waste.png"
              alt="waste"
            />
            <span className="text-delete">Delete</span>
          </button>
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div>
      <ConfirmDialog
        open={popupType === "confirm"}
        onConfirm={() => onFinalDelete()}
        onClose={() => setPopupType(null)}
      />
      <PopupHideItems
        title="Delete"
        count={table.selected.length}
        show={table.selected.length > 0}
        onConfirm={() => handleOpenConfirm(table.selected.map(String))}
        onClose={() => handleCloseAndClear()}
      />
      {popupType === "create" && (
        <CreateUserPopup
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      {popupType === "update" && (
        <UpdateUserPopup
          id={selectedIds.length === 1 ? selectedIds[0] : ""}
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      <SearchBar
        onSearchChange={onSearchChange}
        onCreate={() => {
          setPopupType("create");
        }}
        title="user"
        placeholder={["Name", " Email"]}
        filters={[
          {
            key: "isActive",
            placeholder: "Active",
            options: [
              { label: "Active", value: "true" },
              { label: "InActive", value: "false" },
            ],
          },
        ]}
        onFilterChange={filter.handleFilterChange}
      />
      {loading ? (
        <LoadingPage />
      ) : (
        <>
          <CustomTable
            rows={data.items}
            columns={userColumns}
            order={table.sortOrder}
            orderBy={table.sortBy}
            onSort={table.handleSort}
            selected={table.selected}
            onSelectOne={table.handleSelectOne}
            onSelectAll={(checked) =>
              table.handleSelectAll(checked, data.items || [])
            }
          />
          <Pagination
            totalCount={data.total || 0}
            page={pagination.page}
            onPageChange={(_, newPage) => pagination.setPage(newPage)}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              pagination.setRowsPerPage(newLimit);
              pagination.setPage(0);
            }}
          />
        </>
      )}
    </div>
  );
}
