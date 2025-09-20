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

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  displayText: string;
  isAnimating: boolean;
}

interface ChatBoxProps {
  className?: string;
}

export default function ChatBox({ className }: ChatBoxProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

    const messageId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: messageId,
      username: "Player1", // In a real app, this would be the user's name
      message: chatMessage,
      timestamp: new Date(),
      displayText: "",
      isAnimating: true,
    };

    setChatMessages((prev) => [...prev, newMessage]);
    animateText(chatMessage, messageId);
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
          <CardTitle className="text-lg">Live Chat</CardTitle>
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
                    {msg.timestamp.toLocaleTimeString([], {
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
              disabled={!chatMessage.trim()}
              className="w-full"
            >
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
