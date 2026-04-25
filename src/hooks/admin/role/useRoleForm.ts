import { useState } from "react";
import { ROLE_COLOR_PALETTE } from "../../../styles/status-styles";
import { toast } from "react-toastify";
import { useCreateRole } from "./useCreate";

export const useRoleForm = (onClose: () => void, onSuccess: () => void) => {
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedColorHex, setSelectedColorHex] = useState(ROLE_COLOR_PALETTE.gray.text);
  const [uiLoading, setUiLoading] = useState(false);

  const [form, setForm] = useState({
    role_name: "",
    role_code: "",
    orgId: "",
    colorKey: 'gray'
  });

  const { createRole } = useCreateRole();

  const toggleExpand = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]
    );
  };

  // Logic chọn permission con
  const togglePermission = (parentId: string, permId: string) => {
    setSelectedPerms((prev) => {
      const isChecked = prev.includes(permId);
      if (!isChecked) {
        // Nếu CHƯA chọn: thêm con VÀ thêm luôn cha (nếu cha chưa có)
        const newArr = [...prev, permId];
        if (!prev.includes(parentId)) {
          newArr.push(parentId);
        }
        return newArr;
      } else {
        // Nếu BỎ chọn: chỉ bỏ chọn con
        return prev.filter((p) => p !== permId);
      }
    });
  };

  // Logic chọn cả group cha
  const toggleGroup = (parentId: string, childIds: string[]) => {
    const isAllSelected = childIds.every((id) => selectedPerms.includes(id));
    if (isAllSelected) {
      // Nếu đang chọn hết: Bỏ chọn cả cha lẫn toàn bộ con
      setSelectedPerms((prev) =>
        prev.filter((id) => id !== parentId && !childIds.includes(id))
      );
    } else {
      // Nếu chưa chọn hết: Thêm cha VÀ thêm toàn bộ con
      setSelectedPerms((prev) => {
        const uniqueNewIds = [parentId, ...childIds].filter(id => !prev.includes(id));
        return [...prev, ...uniqueNewIds];
      });
    }
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectColor = (colorHex: string, colorKey: string) => {
    setSelectedColorHex(colorHex);
    setForm((prev) => ({
      ...prev,
      colorKey: colorKey
    }));
  };

  const handleSubmit = async () => {
    if (!form.role_name || !form.role_code || !form.orgId) {
      toast.warning("Please fill all required fields");
      return;
    }

    setUiLoading(true);
    // Lưu ý: Bạn cần truyền đúng data role lên API thay vì data user
    const success = await createRole({
      role_name: form.role_name,
      role_code: form.role_code,
      orgId: form.orgId,
      colorKey: form.colorKey,
      permissionIds: selectedPerms,
    } as any);

    if (success) {
      toast.success("Create role successfully");
      onClose();
      onSuccess();
    }
    setUiLoading(false);
  };

  return {
    form,
    selectedPerms,
    expandedGroups,
    selectedColorHex,
    uiLoading,
    toggleExpand,
    togglePermission,
    toggleGroup,
    handleChange,
    handleSelectColor,
    handleSubmit,
    setForm
  };
};