import DirectMessageCard from './DirectMessageCard';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';

const DirectMessageList = () => {
  const { conversations, sidebarSearchQuery } = useChatStore();
  const { user } = useAuthStore();

  if (!conversations) return null;

  let directConversations = conversations.filter(convo => convo.type === 'direct');

  if (sidebarSearchQuery.trim()) {
    const q = sidebarSearchQuery.toLowerCase();
    directConversations = directConversations.filter(convo => {
      const otherUsers = convo.participants.filter(p => p._id !== user?._id);
      const otherUser = otherUsers.length > 0 ? otherUsers[0] : null;
      return (
        otherUser?.displayName?.toLowerCase().includes(q)
      );
    });
  }

  return (
    <div className='flex-1 overflow-y-auto p-2 space-y-2'>
      {
        directConversations.map(convo => (
          <DirectMessageCard convo={convo} key={convo._id}/>
        ))
      }
      {directConversations.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          Không tìm thấy bạn bè nào
        </div>
      )}
    </div>
  );
};

export default DirectMessageList;