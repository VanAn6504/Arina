import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },

  updateProfile: async (
    displayName: string,
    phoneNumber: string,
    bio: string,
    showOnline?: boolean,
    allowNotifications?: boolean
  ) => {
    const res = await api.put("/users/profile", {
      displayName,
      phoneNumber,
      bio,
      showOnline,
      allowNotifications,
    });
    return res.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const res = await api.put("/users/change-password", { oldPassword, newPassword });
    return res.data;
  },

  blockUser: async (targetUserId: string) => {
    const res = await api.put(`/users/block/${targetUserId}`);
    return res.data;
  },

  unblockUser: async (targetUserId: string) => {
    const res = await api.put(`/users/unblock/${targetUserId}`);
    return res.data;
  },

  getBlockedList: async () => {
    const res = await api.get("/users/blocked-list");
    return res.data;
  },

  getMutualGroups: async (targetUserId: string) => {
    const res = await api.get(`/conversations/mutual-groups/${targetUserId}`);
    return res.data;
  },

  getUserProfile: async (userId: string) => {
    const res = await api.get(`/users/profile/${userId}`);
    return res.data;
  },
};
