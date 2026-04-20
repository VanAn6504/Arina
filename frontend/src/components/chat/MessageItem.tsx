import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { MoreVertical, Edit2, Trash2, Smile, Reply, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/stores/useChatStore";
import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const { deleteMessage, editMessage, reactMessage, setReplyingTo } = useChatStore();

  const prev = index + 1 < messages.length ? messages[index + 1] : undefined; // tin nhắn được sắp xếp theo thứ tự mới đến cũ nên index + 1 sẽ là tin nhắn trước đó
  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
    new Date(prev?.createdAt || 0).getTime() >
    300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  );

  const EMOJIS = ["❤️", "😂", "👍", "😢", "😡", "😮"];

  return (
    <>
      {/* time */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1 mt-4 mb-2">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "flex gap-2 message-bounce mt-2",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8 shrink-0">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "Arina"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-[75%] lg:max-w-[60%] space-y-1 flex flex-col group relative",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          {message.replyTo && typeof message.replyTo === "object" && (
            <div className={cn(
              "text-xs opacity-70 bg-foreground/5 p-2 rounded-lg mb-1 border-l-2 border-primary truncate max-w-full",
              message.isOwn ? "mr-1" : "ml-1"
            )}>
              Trả lời: {(message.replyTo as any).content}
            </div>
          )}

          <div className={cn("flex items-center gap-2 w-full", message.isOwn ? "flex-row-reverse" : "flex-row")}>
            <div className="relative">
              <Card
                className={cn(
                  "p-3",
                  message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received",
                  message.isDeleted && "opacity-50 italic bg-muted text-muted-foreground"
                )}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => {
                      editMessage(message._id, editContent);
                      setIsEditing(false);
                    }}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content || "");
                    }}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.isDeleted ? "Tin nhắn đã bị thu hồi" : message.content}
                  </p>
                )}

                {message.isEdited && !message.isDeleted && (
                  <span className="text-[10px] opacity-70 block text-right mt-1">(Đã chỉnh sửa)</span>
                )}
              </Card>

              {/* Hiển thị React (Nằm ra ngoài Card) */}
              {message.reactions && message.reactions.length > 0 && (
                <div className={cn(
                  "absolute -bottom-3 bg-background rounded-full shadow-sm px-1.5 py-0.5 text-xs flex gap-1 z-10 border border-border/50",
                  message.isOwn ? "right-2" : "right-2"
                )}>
                  {message.reactions.map((r, i) => (
                    <span key={i}>{r.emoji}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Thanh hành động (Action Bar) */}
            {!message.isDeleted && (
              <div className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0",
                message.isOwn ? "flex-row-reverse" : "flex-row"
              )}>
                {/* Nút Trả lời */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background shadow-sm border border-border/50"
                  onClick={() => setReplyingTo(message)}
                >
                  <Reply className="size-3.5 text-muted-foreground" />
                </Button>

                {/* Nút Cảm xúc */}
                <div className="relative group/emoji">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm border border-border/50">
                    <Smile className="size-3.5 text-muted-foreground" />
                  </Button>
                  
                  {/* Bảng Emoji (hiện ra khi hover vào nút Cảm xúc) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/emoji:flex bg-background border border-border/50 rounded-full shadow-lg p-1.5 z-50 items-center gap-1 w-max after:absolute after:-bottom-3 after:left-0 after:w-full after:h-4 after:bg-transparent cursor-default">
                    {EMOJIS.map(emoji => (
                      <button 
                        key={emoji}
                        className="p-1.5 hover:bg-muted rounded-full transition-colors shrink-0 text-xl leading-none flex items-center justify-center hover:scale-125 duration-200 cursor-pointer"
                        onClick={() => reactMessage(message._id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nút 3 chấm (Menu More) */}
                {message.isOwn && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm border border-border/50">
                        <MoreVertical className="size-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={message.isOwn ? "end" : "start"}>
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 size-4" />
                        <span>Sửa tin nhắn</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteMessage(message._id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 size-4" />
                        <span>Thu hồi</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 h-5 border-0 rounded-full flex items-center gap-1 mt-0.5 shadow-sm",
                lastMessageStatus === "seen"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Check className="size-3" />
              {lastMessageStatus === "seen" ? "Đã xem" : "Đã gửi"}
            </Badge>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageItem;
