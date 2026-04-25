import { userService } from "../../../services/admin/user.service";

export const useDelete = () => {
  const deleteSort = async (ids: string[]) => {
    try {
      const res = await userService.deleteSort(ids);
      // console.log(res)
      return res
    } catch (error) {
    } finally {
    }
  }
  return { deleteSort }
}