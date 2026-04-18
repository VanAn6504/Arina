import { Heart, Loader2 } from "lucide-react"; 
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useState } from "react";
import { useUserStore } from "@/stores/useUserStore"; 

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email" | "phoneNumber">;
  label: string;
  type?: string;
  isReadOnly?: boolean;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "username", label: "Tên người dùng", isReadOnly: true },
  { key: "email", label: "Email", type: "email", isReadOnly: true },
  { key: "phoneNumber", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { updateProfile, loading } = useUserStore();

  const [data, setData] = useState({
    displayName: userInfo?.displayName ?? "",
    phoneNumber: userInfo?.phoneNumber ?? "",
    bio: userInfo?.bio ?? "",
  });

  if (!userInfo) return null;

  const handleInputChange = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      await updateProfile(data.displayName, data.phoneNumber, data.bio);
    } catch (error) {
      console.log("Submit failed");
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAL_FIELDS.map(({ key, label, type, isReadOnly }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type ?? "text"}
                value={
                  isReadOnly
                    ? (userInfo[key] as string)
                    : data[key as keyof typeof data]
                }
                onChange={(e) => {
                  if (!isReadOnly) handleInputChange(key, e.target.value);
                }}
                readOnly={isReadOnly}
                className={`glass-light border-border/30 ${
                  isReadOnly
                    ? "bg-muted/50 cursor-not-allowed focus-visible:ring-0 text-muted-foreground"
                    : ""
                }`}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Giới thiệu</Label>
          <Textarea
            id="bio"
            rows={3}
            value={data.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            className="glass-light border-border/30 resize-none"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={loading} 
          className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;