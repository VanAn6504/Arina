import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
  loading: false,

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

  updateProfile: async (displayName: string, phoneNumber: string, bio: string) => {
    try {
      set({ loading: true });

      const responseData = await userService.updateProfile(displayName, phoneNumber, bio);

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
}));
