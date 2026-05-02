import { useState } from "react";
import { toast } from "react-toastify";

// usePageActions.ts
export const usePageActions = (refetch: any, table: any, deleteApi?: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [popupType, setPopupType] = useState<"create" | "update" | "confirm" | null>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);

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
    if (!deleteApi) return;
    try {
      const res = await deleteApi(selectedIds);
      await refetch?.();
      table.handleSelectAll(false, []);
      toast.success(res.message);
      setPopupType(null);
      handleCloseAndClear();
    } catch (error) {
      console.error("Delete Failed", error);
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