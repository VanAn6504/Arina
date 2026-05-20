import { useState } from "react";
import { Shield, Bell, ShieldBan } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ChangePasswordModal from "./ChangePasswordModal";
import BlockedListModal from "./BlockedListModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";

const PrivacySettings = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);
  
  const { user } = useAuthStore();
  const { updateProfile, loading } = useUserStore();

  const handleNotificationToggle = async (checked: boolean) => {
    if (!user) return;
    
    if (checked) {
      // Yêu cầu quyền từ trình duyệt
      if (!("Notification" in window)) {
        toast.error("Trình duyệt của bạn không hỗ trợ thông báo đẩy.");
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Quyền thông báo bị từ chối. Vui lòng bật thủ công trên trình duyệt.");
        return;
      }
    }

    try {
      await updateProfile(
        user.displayName,
        user.phoneNumber || "",
        user.bio || "",
        user.showOnline,
        checked
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật cài đặt thông báo", error);
    }
  };

  return (
    <>
      <Card className="glass-strong border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Quyền riêng tư & Bảo mật
          </CardTitle>
          <CardDescription>
            Quản lý cài đặt quyền riêng tư và bảo mật của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
              className="w-full justify-start glass-light border-border/30 hover:text-warning"
            >
              <Shield className="h-4 w-4 mr-2" />
              Đổi mật khẩu
            </Button>

            <div className="flex items-center justify-between p-3 rounded-md glass-light border border-border/30">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-info" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-foreground">Thông báo đẩy</span>
                  <span className="text-xs text-muted-foreground">Nhận thông báo khi có tin nhắn mới</span>
                </div>
              </div>
              <Switch
                checked={user?.allowNotifications !== false}
                onCheckedChange={handleNotificationToggle}
                disabled={loading}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowBlockedList(true)}
              className="w-full justify-start glass-light border-border/30 hover:text-destructive"
            >
              <ShieldBan className="size-4 mr-2" />
              Danh sách chặn
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordModal
        open={showChangePassword}
        setOpen={setShowChangePassword}
      />

      <BlockedListModal
        open={showBlockedList}
        setOpen={setShowBlockedList}
      />
    </>
  );
};

export default PrivacySettings;
