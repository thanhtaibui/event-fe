import { orgService } from "../../../services/admin/organization.service";

export const useDelete = () => {
  const deleteSort = async (ids: string[]) => {
    try {
      const res = await orgService.deleteSort(ids);
      // console.log(res)
      return res
    } catch (error) {
    } finally {
    }
  }
  return { deleteSort }
}