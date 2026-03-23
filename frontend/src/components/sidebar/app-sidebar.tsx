

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
import { Moon, Sun } from "lucide-react"
import { Switch } from "../ui/switch"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModal from "../chat/NewGroupChatModal"
import GroupChatList from "../chat/GroupChatList"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"
import { useAuthStore } from "@/stores/useAuthStore"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore();
  const {user} = useAuthStore();
  
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
      <SidebarContent>
        {/* newchat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* group chat */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">
            Nhóm Chat
          </SidebarGroupLabel>

          <SidebarGroupAction title="Tạo nhóm" className="cursor-pointer">
            <NewGroupChatModal />
          </SidebarGroupAction>

          <SidebarContent>
            {/* List nhóm chat ở đây */}
            <GroupChatList />
          </SidebarContent> 
        </SidebarGroup>

        {/* ban be */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">
            Bạn bè
          </SidebarGroupLabel>
          
          <SidebarGroupAction title="Kết bạn" className="cursor-pointer">
            <NewGroupChatModal />
          </SidebarGroupAction>

          <SidebarContent>
            <DirectMessageList />
          </SidebarContent> 
        </SidebarGroup>


      </SidebarContent>

      {/* footer */}
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
