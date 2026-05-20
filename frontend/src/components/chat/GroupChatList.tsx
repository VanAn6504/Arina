import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";

const GroupChatList = () => {
  const { conversations, sidebarSearchQuery } = useChatStore();

  if (!conversations) return null;

  let groupChats = conversations.filter(convo => convo.type === 'group');

  if (sidebarSearchQuery.trim()) {
    const q = sidebarSearchQuery.toLowerCase();
    groupChats = groupChats.filter(convo => convo.group?.name?.toLowerCase().includes(q));
  }

  return (
    <div className='flex-1 overflow-y-auto p-2 space-y-2'>
      {
        groupChats.map(convo => (
          <GroupChatCard convo={convo} key={convo._id} />
        ))
      }
      {groupChats.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          Không tìm thấy nhóm nào
        </div>
      )}
    </div>
  );
};

export default GroupChatList;