import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { useFriendStore } from "@/stores/useFriendStore";

const ChatAppPage = () => {
  const { getBlockedList } = useUserStore();
  const { getFriends } = useFriendStore();

  useEffect(() => {
    getBlockedList();
    getFriends();
  }, [getBlockedList, getFriends]);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <div className="flex h-screen w-full p-2">
          <ChatWindowLayout />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default ChatAppPage;