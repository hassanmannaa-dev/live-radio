"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Textarea } from "@/components/ui/8bit/textarea";
import { useSocket } from "@/contexts/SocketContext";

interface ChatMessage {
  id: string;
  userId?: string;
  username: string;
  avatarId?: number;
  message: string;
  timestamp: Date | string;
  displayText: string;
  isAnimating: boolean;
}

interface BackendChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarId: number;
  message: string;
  timestamp: string;
}

interface ChatBoxProps {
  className?: string;
}

export default function ChatBox({ className }: ChatBoxProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected, isAuthenticated } = useSocket();

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Load chat history when connecting
    const handleChatHistory = (messages: BackendChatMessage[]) => {
      console.log("📜 Loading chat history:", messages);
      const formattedMessages = messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        displayText: msg.message,
        isAnimating: false,
      }));
      setChatMessages(formattedMessages);
    };

    // Handle new messages from other users
    const handleNewMessage = (messageData: BackendChatMessage) => {
      console.log("💬 New message received:", messageData);

      const newMessage: ChatMessage = {
        id: messageData.id,
        userId: messageData.userId,
        username: messageData.username,
        avatarId: messageData.avatarId,
        message: messageData.message,
        timestamp: new Date(messageData.timestamp),
        displayText: "",
        isAnimating: true,
      };

      setChatMessages((prev) => [...prev, newMessage]);
      animateText(messageData.message, messageData.id);
    };

    // Handle message errors
    const handleMessageError = (error: { message?: string }) => {
      console.error("❌ Message error:", error);
      alert(error.message || "Failed to send message");
    };

    socket.on("chatHistory", handleChatHistory);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageError", handleMessageError);

    return () => {
      socket.off("chatHistory", handleChatHistory);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageError", handleMessageError);
    };
  }, [socket]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const animateText = (text: string, messageId: string) => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setChatMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const newDisplayText = text.substring(0, currentIndex + 1);
            const isComplete = currentIndex >= text.length - 1;

            if (isComplete) {
              clearInterval(interval);
              return { ...msg, displayText: text, isAnimating: false };
            }

            return { ...msg, displayText: newDisplayText };
          }
          return msg;
        })
      );
      currentIndex++;
    }, 50); // 50ms per character for RPG-style effect
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    if (!socket || !isConnected || !isAuthenticated) {
      alert("Not connected to chat. Please refresh the page.");
      return;
    }

    // Send message via socket
    socket.emit("sendMessage", { message: chatMessage.trim() });
    setChatMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={className}>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">
            Live Chat
            {!isConnected && (
              <span className="text-xs text-muted-foreground ml-2">
                (Connecting...)
              </span>
            )}
            {isConnected && !isAuthenticated && (
              <span className="text-xs text-muted-foreground ml-2">
                (Authenticating...)
              </span>
            )}
            {isConnected && isAuthenticated && (
              <span className="text-xs text-green-500 ml-2">(Connected)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          {/* Chat Messages */}
          <div className="flex-grow overflow-y-auto space-y-3 mb-4 p-2 bg-muted/20 rounded border-2 border-foreground min-h-0">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-primary retro">
                    {msg.username}:
                  </span>
                  <span className="text-xs text-muted-foreground retro">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-sm retro">
                  {msg.displayText}
                  {msg.isAnimating && <span className="animate-pulse">|</span>}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="space-y-2 flex-shrink-0">
            <Textarea
              placeholder="Type your message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="resize-none h-20 bg-background"
              maxLength={200}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatMessage.trim() || !isConnected || !isAuthenticated}
              className="w-full"
            >
              {!isConnected
                ? "Connecting..."
                : !isAuthenticated
                ? "Authenticating..."
                : "Send Message"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
