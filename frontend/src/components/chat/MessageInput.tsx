import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X, File as FileIcon } from "lucide-react";
import { Input } from "../ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import EmojiPicker from "./EmojiPicker";
import { useSocketStore } from "@/stores/useSocketStore";
import { useRef } from "react";
import { useUserStore } from "@/stores/useUserStore";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, replyingTo, setReplyingTo, uploadFile } = useChatStore();
  const { socket } = useSocketStore();
  const { blockedUsers, unblockUser } = useUserStore();
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const recipient = selectedConvo.participants.find((p) => p._id !== user._id);
  const isBlockedByMe = recipient ? blockedUsers.some((u) => u._id === recipient._id) : false;
  const isBlockedByThem = recipient?.blockedUsers?.includes(user._id) || false;

  if (selectedConvo.type === "direct") {
    if (isBlockedByMe) {
      return (
        <div className="flex flex-col items-center justify-center p-4 border-t bg-destructive/5 gap-2 text-center select-none animate-in fade-in slide-in-from-bottom duration-300">
          <span className="text-sm font-medium text-destructive">
            Bạn đã chặn người dùng này. Bỏ chặn để gửi tin nhắn.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => recipient && unblockUser(recipient._id)}
            className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 transition-all text-xs"
          >
            Bỏ chặn
          </Button>
        </div>
      );
    }
    
    if (isBlockedByThem) {
      return (
        <div className="flex items-center justify-center p-4 border-t bg-muted/40 text-center select-none animate-in fade-in slide-in-from-bottom duration-300 min-h-[56px]">
          <span className="text-sm font-medium text-muted-foreground">
            Bạn không thể gửi tin nhắn đến cuộc trò chuyện này.
          </span>
        </div>
      );
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước tệp không được vượt quá 10MB");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const cancelFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!value.trim() && !selectedFile) return;
    const textMsg = value.trim();
    const replyId = replyingTo?._id;

    setValue("");
    setReplyingTo(null);
    setIsUploading(true);

    try {
      if (socket) {
        socket.emit("stop-typing", selectedConvo._id);
      }

      // 1. Gửi file / ảnh trước nếu có
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile);
        const isImage = uploadResult.type === "image";
        
        if (selectedConvo.type === "direct") {
          const otherUser = selectedConvo.participants.filter((p) => p._id !== user._id)[0];
          if (isImage) {
            await sendDirectMessage(otherUser._id, "", uploadResult.url, replyId, "image");
          } else {
            await sendDirectMessage(otherUser._id, uploadResult.name || selectedFile.name, "", replyId, "file", uploadResult.url);
          }
        } else {
          if (isImage) {
            await sendGroupMessage(selectedConvo._id, "", uploadResult.url, replyId, "image");
          } else {
            await sendGroupMessage(selectedConvo._id, uploadResult.name || selectedFile.name, "", replyId, "file", uploadResult.url);
          }
        }
        cancelFileSelection();
      }

      // 2. Gửi tin nhắn chữ kèm theo nếu có
      if (textMsg) {
        if (selectedConvo.type === "direct") {
          const otherUser = selectedConvo.participants.filter((p) => p._id !== user._id)[0];
          await sendDirectMessage(otherUser._id, textMsg, "", replyId, "text");
        } else {
          await sendGroupMessage(selectedConvo._id, textMsg, "", replyId, "text");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {//event nhan vao phim enter de gui tin nhan
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);

    if (socket) {
      socket.emit("typing", selectedConvo._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", selectedConvo._id);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Preview File/Image */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 px-4 bg-primary/5 text-sm border-t border-b animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Upload preview"
                className="w-12 h-12 object-cover rounded-md border"
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md border shrink-0">
                <FileIcon className="size-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="font-semibold text-xs truncate max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isUploading && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Đang tải lên...
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={cancelFileSelection}
              disabled={isUploading}
            >
              <X className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview Reply */}
      {replyingTo && (
        <div className="flex items-center justify-between p-2 px-4 bg-primary/5 text-sm border-t border-b">
          <div className="flex flex-col flex-1 truncate pr-2 border-l-2 border-primary pl-2">
            <span className="font-semibold text-primary text-xs">
              Trả lời {replyingTo.senderId === user._id ? "chính mình" : "tin nhắn"}
            </span>
            <span className="truncate text-muted-foreground">{replyingTo.content}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReplyingTo(null)}>
            <X className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="hover:bg-primary/10 transition-smooth shrink-0"
        >
          <ImagePlus className="size-4" />
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyDown={handleKeyPress}
            value={value}
            onChange={handleTyping}
            placeholder="Soạn tin nhắn..."
            className="pr-12 h-10 bg-muted/50 border-transparent focus:border-primary/50 transition-smooth resize-none rounded-full"
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center">
            <Button
              asChild //add drive sẽ giúp chuyển hết style và hành vi xuống phần tử con thay vì để hai lớp nút lồng nhau.
              variant="ghost"
              size="icon"
              className="size-8 rounded-full hover:bg-primary/10 transition-smooth"
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                />
              </div>
            </Button>
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className="bg-primary hover:bg-primary/90 rounded-full h-10 w-10 p-0 transition-smooth shrink-0"
          disabled={(!value.trim() && !selectedFile) || isUploading}
        >
          <Send className="size-4 text-white ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
