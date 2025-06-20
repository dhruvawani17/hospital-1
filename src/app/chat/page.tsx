
import { ChatbotClient } from "@/components/chatbot/ChatbotClient";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Chat with MediBuddy",
  description: `Ask questions and get help from MediBuddy, your friendly AI assistant for ${APP_NAME}.`,
};

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatbotClient />
    </ProtectedRoute>
  );
}
