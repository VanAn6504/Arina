import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, ShieldBan, UserCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

interface BlockedListModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const BlockedListModal = ({ open, setOpen }: BlockedListModalProps) => {
  const { blockedUsers, getBlockedList, unblockUser, loading } = useUserStore();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      getBlockedList();
    }
  }, [open, getBlockedList]);

  const handleUnblock = async (userId: string) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
    } catch (error) {
      console.error("Lỗi khi bỏ chặn:", error);
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full sm:max-w-md p-6 bg-gradient-glass border-border/30 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <ShieldBan className="size-5 text-destructive animate-pulse" />
            Danh sách chặn
          </DialogTitle>
        </DialogHeader>

        {loading && blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span>Đang tải danh sách chặn...</span>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center gap-2">
            <UserCheck className="size-12 text-muted-foreground/40" />
            <p className="text-sm font-medium">Danh sách chặn trống</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs">
              Bạn chưa chặn bất kỳ ai. Người dùng bạn chặn sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {blockedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 rounded-lg glass-light border border-border/10 hover:border-border/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-border/20">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {user.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate text-foreground">
                      {user.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={unblockingId === user._id}
                  onClick={() => handleUnblock(user._id)}
                  className="glass-light hover:bg-success/10 hover:text-success border-border/30 hover:border-success/30 transition-all duration-300 text-xs h-8"
                >
                  {unblockingId === user._id ? (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  ) : null}
                  Bỏ chặn
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BlockedListModal;
