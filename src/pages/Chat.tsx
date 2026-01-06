import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMain from "@/components/ChatMain";
import { useRealtimeProfiles } from "@/hooks/useRealtimeProfiles";

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // Enable real-time profile updates (status, etc.)
  useRealtimeProfiles();

  return (
    <div className="flex h-screen">
      <ChatSidebar
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      <ChatMain conversationId={selectedConversation} />
    </div>
  );
};

export default ChatPage;
