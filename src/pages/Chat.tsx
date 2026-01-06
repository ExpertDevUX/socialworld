import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMain from "@/components/ChatMain";
import Header from "@/components/Header";
import { useRealtimeProfiles } from "@/hooks/useRealtimeProfiles";

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // Enable real-time profile updates (status, etc.)
  useRealtimeProfiles();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Header />
      <ChatSidebar
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      <ChatMain conversationId={selectedConversation} />
    </div>
  );
};

export default ChatPage;
