import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";

export const useUserStore = create<UserState>((set, get) => ({
  loading: false,
  blockedUsers: [],

  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });

        useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Lỗi khi updateAvatarUrl", error);
      toast.error("Upload avatar không thành công!");
    }
  },

  updateProfile: async (
    displayName: string,
    phoneNumber: string,
    bio: string,
    showOnline?: boolean,
    allowNotifications?: boolean
  ) => {
    try {
      set({ loading: true });

      const responseData = await userService.updateProfile(
        displayName,
        phoneNumber,
        bio,
        showOnline,
        allowNotifications
      );

      const { user, setUser } = useAuthStore.getState();

      if (user) {
        setUser({
          ...user,
          ...responseData.user,
        });
      }
      useChatStore.getState().fetchConversations();

      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      toast.error("Không thể cập nhật thông tin");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      set({ loading: true });
      await userService.changePassword(oldPassword, newPassword);
      toast.success("Đổi mật khẩu thành công!");
    } catch (error: any) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      const errMsg = error?.response?.data?.message || "Không thể đổi mật khẩu";
      toast.error(errMsg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getBlockedList: async () => {
    try {
      set({ loading: true });
      const response = await userService.getBlockedList();
      set({ blockedUsers: response.blockedUsers || [] });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chặn:", error);
      toast.error("Không thể tải danh sách chặn.");
    } finally {
      set({ loading: false });
    }
  },

  blockUser: async (targetUserId) => {
    try {
      set({ loading: true });
      await userService.blockUser(targetUserId);
      toast.success("Đã chặn người dùng.");
      
      // Reload dữ liệu để đồng bộ
      await get().getBlockedList();
      await useFriendStore.getState().getFriends();
      await useChatStore.getState().fetchConversations();
    } catch (error: any) {
      console.error("Lỗi khi chặn người dùng:", error);
      const errMsg = error?.response?.data?.message || "Không thể chặn người dùng.";
      toast.error(errMsg);
    } finally {
      set({ loading: false });
    }
  },

  unblockUser: async (targetUserId) => {
    try {
      set({ loading: true });
      await userService.unblockUser(targetUserId);
      toast.success("Đã bỏ chặn người dùng.");
      
      // Reload dữ liệu để đồng bộ
      await get().getBlockedList();
      await useFriendStore.getState().getFriends();
      await useChatStore.getState().fetchConversations();
    } catch (error: any) {
      console.error("Lỗi khi bỏ chặn người dùng:", error);
      const errMsg = error?.response?.data?.message || "Không thể bỏ chặn người dùng.";
      toast.error(errMsg);
    } finally {
      set({ loading: false });
    }
  },

  getMutualGroups: async (userId) => {
    try {
      const response = await userService.getMutualGroups(userId);
      return response.groups || [];
    } catch (error) {
      console.error("Lỗi khi lấy nhóm chung:", error);
      return [];
    }
  },
}));
