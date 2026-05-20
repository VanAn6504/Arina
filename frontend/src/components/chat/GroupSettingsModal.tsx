import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Conversation } from "@/types/chat";
import type { Friend } from "@/types/user";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { 
  Settings, 
  Edit2, 
  Check, 
  X, 
  Trash2, 
  LogOut, 
  Camera 
} from "lucide-react";
import { toast } from "sonner";
import IniviteSuggestionList from "../newGroupChat/IniviteSuggestionList";
import SelectedUsersList from "../newGroupChat/SelectedUsersList";

interface GroupSettingsModalProps {
  selectedConvo: Conversation;
}

const GroupSettingsModal = ({ selectedConvo }: GroupSettingsModalProps) => {
  const { user } = useAuthStore();
  const { 
    addMembersToGroup, 
    removeMemberFromGroup, 
    leaveGroup, 
    updateGroupInfo, 
    loading 
  } = useChatStore();
  
  const { friends, getFriends } = useFriendStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(selectedConvo.group?.name || "");
  const [search, setSearch] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      getFriends();
      setNewGroupName(selectedConvo.group?.name || "");
    }
  }, [isOpen, selectedConvo.group?.name]);

  if (!user || selectedConvo.type !== "group") return null;

  const isCreator = selectedConvo.group?.createdBy === user._id;

  const handleUpdateName = async () => {
    if (!newGroupName.trim()) {
      toast.error("Tên nhóm không được để trống");
      return;
    }
    try {
      await updateGroupInfo(selectedConvo._id, newGroupName.trim());
      setIsEditingName(false);
      toast.success("Cập nhật tên nhóm thành công");
    } catch (error) {
      toast.error("Không thể cập nhật tên nhóm");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước tệp không được vượt quá 10MB");
      return;
    }

    try {
      await updateGroupInfo(selectedConvo._id, undefined, file);
      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (error) {
      toast.error("Không thể tải lên ảnh đại diện");
    }
  };

  const handleAddMembers = async () => {
    if (invitedUsers.length === 0) return;
    try {
      await addMembersToGroup(selectedConvo._id, invitedUsers.map(u => u._id));
      setInvitedUsers([]);
      setSearch("");
      toast.success("Thêm thành viên thành công");
    } catch (error) {
      toast.error("Không thể thêm thành viên");
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá thành viên này ra khỏi nhóm?")) {
      try {
        await removeMemberFromGroup(selectedConvo._id, memberId);
        toast.success("Đã xoá thành viên khỏi nhóm");
      } catch (error) {
        toast.error("Không thể xoá thành viên");
      }
    }
  };

  const handleLeaveGroup = async () => {
    const confirmMsg = isCreator 
      ? "Bạn là Trưởng nhóm. Nếu rời đi, quyền Trưởng nhóm sẽ được chuyển cho thành viên khác. Bạn vẫn muốn rời?" 
      : "Bạn có chắc chắn muốn rời khỏi nhóm này?";
    
    if (window.confirm(confirmMsg)) {
      try {
        await leaveGroup(selectedConvo._id);
        setIsOpen(false);
        toast.success("Đã rời nhóm thành công");
      } catch (error) {
        toast.error("Lỗi xảy ra khi rời nhóm");
      }
    }
  };

  // Filter friends: must be friends, and not already in the group, and not already in invited list
  const filteredFriends = friends.filter(
    (friend) =>
      friend.displayName.toLowerCase().includes(search.toLowerCase()) &&
      !selectedConvo.participants.some((p) => p._id === friend._id) &&
      !invitedUsers.some((u) => u._id === friend._id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full ml-auto hover:bg-muted shrink-0"
        >
          <Settings className="size-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px] border-none max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center border-b pb-2">
            Thông tin nhóm
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar and Creator Controls */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group/avatar">
              <Avatar className="size-24 border shadow-sm">
                <AvatarImage src={selectedConvo.group?.avatarUrl} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                  {selectedConvo.group?.name?.substring(0, 2).toUpperCase() || "GR"}
                </AvatarFallback>
              </Avatar>
              
              {isCreator && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="size-6 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Group Name Editing */}
            <div className="flex items-center gap-2 max-w-full">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-8 max-w-[200px]"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={handleUpdateName}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setIsEditingName(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-base truncate max-w-[240px]">
                    {selectedConvo.group?.name}
                  </h3>
                  {isCreator && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full hover:bg-muted"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Edit2 className="size-3 text-muted-foreground" />
                    </Button>
                  )}
                </>
              )}
            </div>
            
            <span className="text-xs text-muted-foreground">
              Nhóm có {selectedConvo.participants.length} thành viên
            </span>
          </div>

          {/* Add Members Section */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Thêm thành viên mới
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tìm bạn bè..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
              {invitedUsers.length > 0 && (
                <Button
                  onClick={handleAddMembers}
                  disabled={loading}
                  className="bg-primary text-white text-xs h-9"
                >
                  Xác nhận
                </Button>
              )}
            </div>

            {search && filteredFriends.length > 0 && (
              <IniviteSuggestionList
                filteredFriends={filteredFriends}
                onSelect={(friend) => {
                  setInvitedUsers([...invitedUsers, friend]);
                  setSearch("");
                }}
              />
            )}

            <SelectedUsersList
              invitedUsers={invitedUsers}
              onRemove={(user) => {
                setInvitedUsers(invitedUsers.filter(u => u._id !== user._id));
              }}
            />
          </div>

          {/* Member List */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Thành viên ({selectedConvo.participants.length})
            </Label>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {selectedConvo.participants.map((member) => {
                const isAdmin = selectedConvo.group?.createdBy === member._id;
                const isSelf = member._id === user._id;

                return (
                  <div key={member._id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 transition">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs font-bold">
                          {member.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.displayName} {isSelf && "(Bạn)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-[10px] px-2 py-0.5 border-0 rounded-full font-semibold">
                          Trưởng nhóm
                        </Badge>
                      )}
                      
                      {isCreator && !isSelf && !isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                          onClick={() => handleKickMember(member._id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave Group / Danger Zone */}
          <div className="border-t pt-4">
            <Button
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 text-sm h-10 hover:opacity-90"
              onClick={handleLeaveGroup}
              disabled={loading}
            >
              <LogOut className="size-4" />
              Rời khỏi nhóm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettingsModal;
