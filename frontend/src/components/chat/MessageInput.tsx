import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import EmojiPicker from "./EmojiPicker";
import { useSocketStore } from "@/stores/useSocketStore";
import { useRef } from "react";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, replyingTo, setReplyingTo } = useChatStore();
  const { socket } = useSocketStore();
  const [value, setValue] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!user) return;

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currValue = value;
    const replyId = replyingTo?._id;

    setValue("");
    setReplyingTo(null);
    if (socket) {
      socket.emit("stop-typing", selectedConvo._id);
    }

    try {
      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currValue, undefined, replyId);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue, undefined, replyId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
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
        <Button
          variant="ghost"
          size="icon"
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
          disabled={!value.trim()}
        >
          <Send className="size-4 text-white ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
