// import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
// import { AppSidebar } from "@/components/sidebar/app-sidebar";
// import { SidebarProvider } from "@/components/ui/sidebar";

// const ChatAppPage = () => {
//   return (
//     <SidebarProvider>
//       <AppSidebar />

//       <div className="flex h-screen w-full p-2">
//         <ChatWindowLayout />
//       </div>
//     </SidebarProvider>
//   );
// };

// export default ChatAppPage;

import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

// Thêm dòng import này (đường dẫn chuẩn của Shadcn UI)
import { TooltipProvider } from "@/components/ui/tooltip";

const ChatAppPage = () => {
  return (
    // Bọc TooltipProvider ở ngoài cùng để mọi component con đều dùng được Tooltip
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