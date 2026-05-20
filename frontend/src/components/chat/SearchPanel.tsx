import { useChatStore } from "@/stores/useChatStore";
import { useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X, Search, MessageSquare, Loader2, File as FileIcon } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

const makeHighlightRegex = (keyword: string) => {
  if (!keyword) return null;
  const map: any = {
    a: "[aàáảãạăằắẳẵặâầấẩẫậ]",
    d: "[dđ]",
    e: "[eèéẻẽẹêềếểễệ]",
    i: "[iìíỉĩị]",
    o: "[oòóỏõọôồốổỗộơờớởỡợ]",
    u: "[uùúủũụưừứửữự]",
    y: "[yỳýỷỹỵ]",
  };

  let regexStr = "";
  for (const char of keyword.toLowerCase()) {
    if (map[char]) {
      regexStr += map[char];
    } else {
      regexStr += char.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
  }
  return new RegExp(`(${regexStr})`, "gi");
};

export default function SearchPanel() {
  const {
    searchResults,
    searchKeyword,
    searchMessages,
    setShowSearchPanel,
    setActiveConversation,
    activeConversationId,
    fetchMessagesAround,
    setHighlightedMessageId,
  } = useChatStore();

  const [keyword, setKeyword] = useState(searchKeyword);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (keyword.trim()) {
        setLoading(true);
        await searchMessages(keyword, activeConversationId || undefined);
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [keyword, activeConversationId, searchMessages]);

  const highlightKeyword = (text: string, kw: string) => {
    if (!kw || !text) return text;
    const regex = makeHighlightRegex(kw);
    if (!regex) return text;
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-primary/20 text-primary dark:text-primary-foreground font-semibold px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const scrollToAndHighlight = (messageId: string) => {
    setHighlightedMessageId(messageId);
    
    // Đợi DOM render xong rồi mới scroll
    setTimeout(() => {
      const element = document.getElementById(`msg-${messageId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // Thử lại lần nữa đề phòng DOM trễ
        setTimeout(() => {
          const element2 = document.getElementById(`msg-${messageId}`);
          if (element2) {
            element2.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }, 150);
  };

  const handleResultClick = async (result: any) => {
    const convoId = result.conversation._id;
    const msgId = result._id;

    if (activeConversationId !== convoId) {
      setActiveConversation(convoId);
      await fetchMessagesAround(convoId, msgId);
    } else {
      const element = document.getElementById(`msg-${msgId}`);
      if (!element) {
        await fetchMessagesAround(convoId, msgId);
      }
    }

    scrollToAndHighlight(msgId);
  };

  // Group search results by conversation
  const groupedResults: { [key: string]: { convo: any; items: any[] } } = {};
  searchResults.forEach((r) => {
    const convoId = r.conversation._id;
    if (!groupedResults[convoId]) {
      groupedResults[convoId] = { convo: r.conversation, items: [] };
    }
    groupedResults[convoId].items.push(r);
  });

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          Tìm kiếm tin nhắn
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setShowSearchPanel(false)}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nhập từ khóa cần tìm..."
            className="pl-9 pr-4 h-9 text-sm"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-5 animate-spin" />
            <span>Đang tìm kiếm...</span>
          </div>
        ) : keyword.trim() === "" ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            Nhập từ khóa phía trên để tìm kiếm trong cuộc trò chuyện này.
          </div>
        ) : Object.keys(groupedResults).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
            <MessageSquare className="size-5 opacity-40" />
            <span>Không tìm thấy tin nhắn nào</span>
          </div>
        ) : (
          Object.values(groupedResults).map(({ convo, items }) => (
            <div key={convo._id} className="space-y-2">
              {/* Convo Header */}
              <div className="flex items-center justify-between bg-muted/40 px-2.5 py-1.5 rounded border border-border/40 select-none">
                <span className="text-xs font-semibold text-muted-foreground truncate max-w-[75%]">
                  {convo.name}
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                  {convo.type === "group" ? "Nhóm" : "Cá nhân"}
                </Badge>
              </div>

              {/* Convo Items */}
              <div className="space-y-1.5 pl-1">
                {items.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleResultClick(item)}
                    className="p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-150 flex gap-2.5 items-start"
                  >
                    <UserAvatar
                      type="chat"
                      name={item.sender.displayName}
                      avatarUrl={item.sender.avatarUrl || undefined}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.sender.displayName}
                        </span>
                        <span className="text-[9px] text-muted-foreground shrink-0">
                          {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground break-words line-clamp-2">
                        {item.type === "file" ? (
                          <span className="flex items-center gap-1 text-primary">
                            <FileIcon className="size-3 shrink-0" />
                            {highlightKeyword(item.content, keyword)}
                          </span>
                        ) : (
                          highlightKeyword(item.content, keyword)
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
