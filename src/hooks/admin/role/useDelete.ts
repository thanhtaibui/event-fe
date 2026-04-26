import { roleService } from "../../../services/admin/role.service";

export const useDelete = () => {
  const deleteSort = async (ids: string[]) => {
    try {
      const res = await roleService.deleteSort(ids);
      // console.log(res)
      return res
    } catch (error) {
    } finally {
    }
  }
  return { deleteSort }
}