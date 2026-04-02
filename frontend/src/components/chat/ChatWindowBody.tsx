import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import MessageItem from "./MessageItem";
import InfiniteScroll from "react-infinite-scroll-component";

const ChatWindowBody = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    fetchMessages,
  } = useChatStore();
  
  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">(
    "delivered"
  );//kt trạng thái đã xem hay chưa

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const reversedMessages = [...messages].reverse();// đảo ngược thứ tự tin nhắn để hiển thị từ mới nhất đến cũ nhất
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const selectedConvo = conversations.find((c) => c._id === activeConversationId);
  const key = `chat-scroll-${activeConversationId}`;

  // ref
  const messagesEndRef = useRef<HTMLDivElement>(null); // để scroll đến tin nhắn mới nhất
  const containerRef = useRef<HTMLDivElement>(null); // để lưu vị trí scroll khi chuyển cuộc trò chuyện

  // seen status
  useEffect(() => {
    const lastMessage = selectedConvo?.lastMessage;
    if (!lastMessage) {
      return;
    }

    const seenBy = selectedConvo?.seenBy ?? [];

    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
  }, [selectedConvo]);

   // kéo xuống dưới khi load convo
  useLayoutEffect(() => { // scroll đến tin nhắn mới nhất khi chuyển cuộc trò chuyện
    if (!messagesEndRef.current) return;

    messagesEndRef.current?.scrollIntoView({  block: "end" });
  }, [activeConversationId]);//chay khi chuyển cuộc trò chuyện

  const fetchMoreMessages = async () => {
    if (!activeConversationId) {
      return;
    }

    try {
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error("Lỗi xảy ra khi fetch thêm tin", error);
    }
  };

  const handleScrollSave = () => {
    const container = containerRef.current;
    if (!container || !activeConversationId) {
      return;
    }

    sessionStorage.setItem(
      key,
      JSON.stringify({
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
      })
    );
  };

  useLayoutEffect(() => {  // khôi phục vị trí scroll khi chuyển lại cuộc trò chuyện
    const container = containerRef.current;
    if (!container) return;

    const item = sessionStorage.getItem(key);

    if (item) {
      const { scrollTop } = JSON.parse(item);
      requestAnimationFrame(() => { // dùng requestAnimationFrame để đảm bảo DOM đã được cập nhật trước khi scroll
        container.scrollTop = scrollTop;
      });
    }
  }, [messages.length]);

  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }

  if (!messages?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground ">
        Chưa có tin nhắn nào trong cuộc trò chuyện này.
      </div>
    );
  }

  return (
    <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
      <div
        id="scrollableDiv"
        ref={containerRef}
        onScroll={handleScrollSave}
        className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar"
      >
        <div ref={messagesEndRef}></div>   

        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMoreMessages}
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          loader={<p>Đang tải...</p>}
          inverse={true}
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            overflow: "visible",
          }}
        >  
          {reversedMessages.map((message, index) => (
            <MessageItem
              key={message._id ?? index}
              message={message}
              index={index}
              messages={reversedMessages}
              selectedConvo={selectedConvo}
              lastMessageStatus={lastMessageStatus}
            />
          ))}
        </InfiniteScroll>

      </div>
    </div>
  );
};

export default ChatWindowBody;
