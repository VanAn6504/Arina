

import { useState, useEffect } from "react"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Moon, Sun, Search, Loader2, File as FileIcon } from "lucide-react"
import { Switch } from "../ui/switch"
import { Input } from "../ui/input"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModal from "../chat/NewGroupChatModal"
import GroupChatList from "../chat/GroupChatList"
import AddFriendModal from "../chat/AddFriendModal"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useChatStore } from "@/stores/useChatStore"
import ConversationSkeleton from "../skeleton/ConversationSkeleton"



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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const {
    convoLoading,
    sidebarSearchQuery,
    setSidebarSearchQuery,
    sidebarSearchResults,
    sidebarSearchLoading,
    searchSidebarMessages,
    setActiveConversation,
    activeConversationId,
    fetchMessagesAround,
    setHighlightedMessageId,
  } = useChatStore();

  const [localQuery, setLocalQuery] = useState(sidebarSearchQuery);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarSearchQuery(localQuery);
      if (localQuery.trim()) {
        searchSidebarMessages(localQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localQuery, setSidebarSearchQuery, searchSidebarMessages]);

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

    setHighlightedMessageId(msgId);
    setTimeout(() => {
      const element = document.getElementById(`msg-${msgId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTimeout(() => {
          const element2 = document.getElementById(`msg-${msgId}`);
          if (element2) {
            element2.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }, 150);
  };

  return (
    <Sidebar variant="inset" {...props}>
      {/* header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="bg-gradient-primary">
              <a href="#">
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white">Arina</h1>
                  <div className="flex item-center gap-2">
                    <Sun className="size-4 text-white/80" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/80"
                    />
                    <Moon className="size-4 text-white/80" />
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* content */}
      <SidebarContent className="beautiful-scrollbar">
        {/* search bar */}
        <SidebarGroup className="py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-9 pr-4 h-9 bg-background/50 border-border/50 text-sm w-full focus-visible:ring-1"
            />
          </div>
        </SidebarGroup>

        {/* newchat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* search results for messages */}
        {sidebarSearchQuery.trim() !== "" && (
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 mb-2">
              <SidebarGroupLabel className="uppercase text-xs font-semibold text-muted-foreground">Tin nhắn tìm thấy</SidebarGroupLabel>
            </div>
            <SidebarContent className="space-y-1 px-2 overflow-visible">
              {sidebarSearchLoading ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang tìm tin nhắn...</span>
                </div>
              ) : sidebarSearchResults.length === 0 ? (
                <div className="text-[11px] text-muted-foreground px-2 py-2 bg-muted/20 rounded-md">
                  Không tìm thấy tin nhắn nào
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sidebarSearchResults.map((msg) => (
                    <div
                      key={msg._id}
                      onClick={() => handleResultClick(msg)}
                      className="p-2 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-150 flex flex-col gap-1 select-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground truncate max-w-[65%]">
                          {msg.conversation.name}
                        </span>
                        <span className="text-[8px] text-muted-foreground shrink-0">
                          {new Date(msg.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground truncate max-w-[40%] shrink-0">
                          {msg.sender.displayName}:
                        </span>
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {msg.type === "file" ? (
                            <span className="flex items-center gap-0.5 text-primary text-[11px]">
                              <FileIcon className="size-3 shrink-0" />
                              {highlightKeyword(msg.content, sidebarSearchQuery)}
                            </span>
                          ) : (
                            highlightKeyword(msg.content, sidebarSearchQuery)
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SidebarContent>
          </SidebarGroup>
        )}

        {/* group chat */}
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel className="uppercase">nhóm chat</SidebarGroupLabel>
            <NewGroupChatModal />
          </div>

          <SidebarContent>
            {convoLoading ? <ConversationSkeleton /> : <GroupChatList />}
          </SidebarContent>
        </SidebarGroup>

        {/* ban be */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Bạn bè</SidebarGroupLabel>

          <SidebarGroupAction title="Kết bạn" className="cursor-pointer">
            <AddFriendModal />
          </SidebarGroupAction>

          <SidebarContent>
            {convoLoading ? <ConversationSkeleton /> : <DirectMessageList />}
          </SidebarContent>
        </SidebarGroup>
      </SidebarContent>

      {/* footer */}
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
