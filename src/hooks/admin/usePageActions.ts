import { useState } from "react";
import { toast } from "react-toastify";
import { useDelete } from "./role/useDelete";

// usePageActions.ts
export const usePageActions = (refetch: any, table: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [popupType, setPopupType] = useState<"create" | "update" | "confirm" | null>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const { deleteSort } = useDelete();

  // Mở popup confirm xóa
  const openDeleteConfirm = (ids: string[]) => {
    setSelectedIds(ids);
    setPopupType("confirm");
  };

  // Mở popup cập nhật
  const openUpdate = (item: any) => {
    setCurrentItem(item);
    setPopupType("update");
  };

  // Hàm thực thi xóa cuối cùng
  const onFinalDelete = async () => {
    const res = await deleteSort(selectedIds);
    if (res) {
      toast.success(res.message);
      setPopupType(null);
      table.handleSelectAll(false, []);
      await refetch?.();
    }
  };
  const handleOpenConfirm = (selectedIds: string[]) => {
    setSelectedIds(selectedIds);
    setPopupType("confirm");
  };
  const handleCloseAndClear = () => {
    table.handleSelectAll(false, []);
  };
  return {
    handleOpenConfirm,
    popupType,
    setSelectedIds,
    setPopupType,
    selectedIds,
    currentItem,
    openDeleteConfirm,
    openUpdate,
    onFinalDelete,
    handleCloseAndClear
  };
};