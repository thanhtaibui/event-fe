import { useRef, useState } from "react";
import { toast } from "react-toastify";

// usePageActions.ts
export const usePageActions = (refetch: any, table: any, deleteApi?: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [popupType, setPopupType] = useState<"create" | "update" | "confirm" | null>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingRef = useRef(false);

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
    if (!deleteApi || isDeleting || deletingRef.current || selectedIds.length === 0) return;

    deletingRef.current = true;
    setIsDeleting(true);
    try {
      const res = await deleteApi(selectedIds);
      await refetch?.();
      table.handleSelectAll(false, []);
      if (res?.message) {
        toast.success(res.message);
      }
      setPopupType(null);
      handleCloseAndClear();
    } catch (error) {
      console.error("Delete Failed", error);
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
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
    isDeleting,
    openDeleteConfirm,
    openUpdate,
    onFinalDelete,
    handleCloseAndClear
  };
};
