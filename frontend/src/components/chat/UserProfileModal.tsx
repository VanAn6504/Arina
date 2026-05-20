import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { userService } from "@/services/userService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  Loader2,
  ShieldBan,
  UserX,
  UserPlus,
  Users,
  Phone,
  Info,
  ChevronRight,
  ShieldCheck,
  Clock,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/types/user";

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileModal = ({ userId, open, onOpenChange }: UserProfileModalProps) => {
  const { user: currentUser } = useAuthStore();
  const { blockUser, unblockUser, getMutualGroups, getBlockedList, blockedUsers } = useUserStore();
  const { friends, sentList, receivedList, addFriend, acceptRequest, declineRequest, cancelFriendRequest, removeFriend } = useFriendStore();
  const { setActiveConversation } = useChatStore();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [mutualGroups, setMutualGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Lấy thông tin user mục tiêu từ API hoặc fallback
  useEffect(() => {
    if (!open || !userId) return;

    const fetchUserProfile = async () => {
      try {
        const res = await userService.getUserProfile(userId);
        if (res?.user) {
          setTargetUser(res.user);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin người dùng từ API:", error);
        
        // Fallback sang store cục bộ
        const allUsers = [
          ...friends,
          ...blockedUsers,
          ...(sentList.map((r) => r.to).filter(Boolean) as User[]),
          ...(receivedList.map((r) => r.from).filter(Boolean) as User[]),
        ];

        const conversations = useChatStore.getState().conversations;
        conversations.forEach((c) => {
          c.participants?.forEach((p) => {
            allUsers.push({
              _id: p._id,
              displayName: p.displayName,
              avatarUrl: p.avatarUrl || undefined,
              username: p.displayName.toLowerCase().replace(/\s+/g, ""),
            } as User);
          });
        });

        const found = allUsers.find((u) => u._id === userId);
        if (found) {
          setTargetUser(found);
        } else {
          setTargetUser({
            _id: userId,
            displayName: "Người dùng",
            username: "user",
          } as User);
        }
      }
    };

    fetchUserProfile();

    // Tải nhóm chung
    setLoadingGroups(true);
    getMutualGroups(userId)
      .then((groups) => {
        setMutualGroups(groups);
      })
      .finally(() => {
        setLoadingGroups(false);
      });
  }, [open, userId, friends, blockedUsers, sentList, receivedList, getMutualGroups]);

  if (!open || !userId || !targetUser) return null;

  // Trạng thái quan hệ bạn bè
  const isFriend = friends.some((f) => f._id === userId);
  const isBlocked = blockedUsers.some((u) => u._id === userId);
  
  const pendingSentRequest = sentList.find((r) => r.to?._id === userId);
  const pendingReceivedRequest = receivedList.find((r) => r.from?._id === userId);

  const handleBlockAction = async () => {
    setActionLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(userId);
      } else {
        await blockUser(userId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFriendAction = async () => {
    setActionLoading(true);
    try {
      if (isFriend) {
        if (confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${targetUser.displayName}?`)) {
          await removeFriend(userId);
          toast.success("Đã hủy kết bạn.");
        }
      } else if (pendingSentRequest) {
        await cancelFriendRequest(pendingSentRequest._id);
        toast.success("Đã hủy yêu cầu kết bạn.");
      } else if (pendingReceivedRequest) {
        await acceptRequest(pendingReceivedRequest._id);
        toast.success("Đã chấp nhận kết bạn.");
      } else {
        const msg = await addFriend(userId);
        toast.success(msg);
      }
    } catch (error) {
      console.error(error);
      toast.error("Thao tác thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!pendingReceivedRequest) return;
    setActionLoading(true);
    try {
      await declineRequest(pendingReceivedRequest._id);
      toast.success("Đã từ chối lời mời.");
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const navigateToGroup = (groupConvoId: string) => {
    setActiveConversation(groupConvoId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md p-6 bg-gradient-glass border-border/30 shadow-2xl overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Info className="size-5 text-primary" />
            Hồ sơ người dùng
          </DialogTitle>
        </DialogHeader>

        {/* Thông tin chính */}
        <div className="flex flex-col items-center text-center mt-2 space-y-3 pb-4 border-b border-border/10">
          <Avatar className="size-24 border-2 border-primary/20 shadow-lg">
            <AvatarImage src={targetUser.avatarUrl} alt={targetUser.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
              {targetUser.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground truncate max-w-[280px]">
              {targetUser.displayName}
            </h3>
            <p className="text-xs text-muted-foreground">@{targetUser.username}</p>
          </div>
        </div>

        {/* Chi tiết thông tin cá nhân */}
        <div className="py-3 space-y-3 border-b border-border/10">
          <div className="flex items-start gap-3">
            <Info className="size-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Giới thiệu</p>
              <p className="text-sm text-foreground break-words">
                {targetUser.bio || "Không có thông tin giới thiệu."}
              </p>
            </div>
          </div>
          
          {targetUser.phoneNumber && (
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Số điện thoại</p>
                <p className="text-sm text-foreground">{targetUser.phoneNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nhóm chung */}
        <div className="py-2">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Users className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Nhóm chung ({mutualGroups.length})</span>
          </div>

          {loadingGroups ? (
            <div className="flex items-center justify-center py-3 text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-xs">Đang tìm nhóm chung...</span>
            </div>
          ) : mutualGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Không có nhóm chung nào.</p>
          ) : (
            <div className="max-h-[110px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {mutualGroups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => navigateToGroup(group._id)}
                  className="w-full flex items-center justify-between p-2 rounded-md glass-light hover:bg-background/20 border border-border/10 transition-all text-left text-xs"
                >
                  <span className="font-medium text-foreground truncate max-w-[240px]">
                    {group.group?.name || "Nhóm không tên"}
                  </span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Các nút tương tác */}
        {currentUser?._id !== userId && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/10">
            <div className="flex gap-2">
              {/* Nút Kết bạn / Hủy bạn bè */}
              {!isBlocked && (
                <Button
                  disabled={actionLoading}
                  onClick={handleFriendAction}
                  className="flex-1 text-xs"
                  variant={isFriend ? "destructive" : pendingSentRequest ? "secondary" : "default"}
                >
                  {actionLoading ? (
                    <Loader2 className="size-4 animate-spin mr-1" />
                  ) : isFriend ? (
                    <UserX className="size-4 mr-1" />
                  ) : pendingSentRequest ? (
                    <Clock className="size-4 mr-1" />
                  ) : pendingReceivedRequest ? (
                    <Check className="size-4 mr-1" />
                  ) : (
                    <UserPlus className="size-4 mr-1" />
                  )}
                  {isFriend
                    ? "Hủy kết bạn"
                    : pendingSentRequest
                    ? "Hủy yêu cầu"
                    : pendingReceivedRequest
                    ? "Chấp nhận"
                    : "Thêm bạn bè"}
                </Button>
              )}

              {/* Nút Từ chối lời mời nếu nhận được */}
              {!isBlocked && pendingReceivedRequest && (
                <Button
                  disabled={actionLoading}
                  variant="outline"
                  onClick={handleDeclineRequest}
                  className="text-xs glass-light border-border/30 hover:text-destructive"
                >
                  {actionLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                </Button>
              )}

              {/* Nút Chặn / Bỏ chặn */}
              <Button
                disabled={actionLoading}
                onClick={handleBlockAction}
                variant="outline"
                className={`flex-1 text-xs glass-light border-border/30 ${
                  isBlocked
                    ? "hover:text-success hover:border-success/30"
                    : "hover:text-destructive hover:border-destructive/30"
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : isBlocked ? (
                  <ShieldCheck className="size-4 mr-1 text-success" />
                ) : (
                  <ShieldBan className="size-4 mr-1 text-destructive" />
                )}
                {isBlocked ? "Bỏ chặn" : "Chặn người này"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
