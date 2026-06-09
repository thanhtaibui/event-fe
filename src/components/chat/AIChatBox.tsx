import ChatBot from "react-chatbotify";
import "../../styles/chat/aiChat.css";

export default function AICreativeChat() {
  const flow = {
    start: {
      message: "👋 Hi there! What would you like me to help you with today?",
      options: [
        "Resize image",
        "Improve image",
        "Create event poster",
        "Create organization banner",
      ],
      path: "mock_result",
    },
    mock_result: {
      message:
        "Great. This is mock UI for now. Later I will call your backend AI API and return generated images.",
      path: "start",
    },
  };

  return (
    <div className="ai-creative-chat">
      <ChatBot
        flow={flow}
        settings={{
          general: {
            embedded: false,
          },
          header: {
            title: "AI Creative Studio",
          },
          chatButton: {
            icon: "🤖",
          },
          footer: {
            text: "Powered by React ChatBotify",
          },
          tooltip: {
            text: "Let's Talk",
          },
        }}
      />
    </div>
  );
}
