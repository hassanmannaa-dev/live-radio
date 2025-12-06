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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/8bit/avatar";
import { ScrollArea } from "@/components/ui/8bit/scroll-area";
import { useSocket } from "@/contexts/SocketContext";
import { useQueue } from "@/contexts/QueueContext";

interface ChatMessage {
  id: string;
  userId?: string;
  username: string;
  avatarId?: number;
  message: string;
  timestamp: Date | string;
  displayText: string;
  isAnimating: boolean;
  isSearchResult?: boolean;
  searchResults?: SearchResult[];
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
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
  const [isSearching, setIsSearching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected, isAuthenticated } = useSocket();
  const { addToQueue, isInQueue, addingToQueue } = useQueue();

  // Helper function to determine if message should show user info
  const shouldShowUserInfo = (
    currentMsg: ChatMessage,
    index: number
  ): boolean => {
    if (index === 0) return true; // Always show for first message

    const previousMsg = chatMessages[index - 1];
    return (
      !previousMsg ||
      previousMsg.userId !== currentMsg.userId ||
      previousMsg.username !== currentMsg.username
    );
  };

  // Helper function to generate avatar image URL or fallback
  const getAvatarContent = (avatarId?: number, username?: string) => {
    if (avatarId) {
      // Use the same avatar pattern as the registration page
      return {
        src: `https://i.pravatar.cc/150?img=${avatarId}`,
        fallback: username?.charAt(0).toUpperCase() || "?",
      };
    }
    return {
      src: undefined,
      fallback: username?.charAt(0).toUpperCase() || "?",
    };
  };

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Load chat history when connecting
    const handleChatHistory = ({ messages }: { messages: BackendChatMessage[] }) => {
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

  // Function to perform song search
  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const response = await fetch(
        `http://localhost:5000/api/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      // Create a search result message that only the current user can see
      const searchMessage: ChatMessage = {
        id: `search-${Date.now()}`,
        userId: localStorage.getItem("userId") || undefined,
        username: localStorage.getItem("userName") || "You",
        avatarId: parseInt(localStorage.getItem("userAvatar") || "1"),
        message: `/search ${query}`,
        timestamp: new Date(),
        displayText: `Search result for "${query}":`,
        isAnimating: false,
        isSearchResult: true,
        searchResults: data.song
          ? [
              {
                id: data.song.id,
                title: data.song.title,
                artist: data.song.artist || "Unknown Artist",
                thumbnail: data.song.thumbnail,
              },
            ]
          : [],
      };

      setChatMessages((prev) => [...prev, searchMessage]);
    } catch (error) {
      console.error("Search error:", error);

      // Show error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        userId: localStorage.getItem("userId") || undefined,
        username: "System",
        message: "Search failed. Please try again.",
        timestamp: new Date(),
        displayText: "Search failed. Please try again.",
        isAnimating: false,
      };

      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to handle adding song to queue with feedback
  const handleAddToQueue = async (songId: string, songTitle: string) => {
    // Check if already in queue or being added
    if (isInQueue(songId)) {
      const alreadyInQueueMessage: ChatMessage = {
        id: `already-${Date.now()}`,
        userId: localStorage.getItem("userId") || undefined,
        username: "System",
        message: `Song already in queue`,
        timestamp: new Date(),
        displayText: `⚠️ "${songTitle}" is already in the queue`,
        isAnimating: false,
      };
      setChatMessages((prev) => [...prev, alreadyInQueueMessage]);
      return;
    }

    if (addingToQueue.has(songId)) {
      const addingMessage: ChatMessage = {
        id: `adding-${Date.now()}`,
        userId: localStorage.getItem("userId") || undefined,
        username: "System",
        message: `Song being added`,
        timestamp: new Date(),
        displayText: `⏳ Adding "${songTitle}" to queue...`,
        isAnimating: false,
      };
      setChatMessages((prev) => [...prev, addingMessage]);
      return;
    }

    try {
      const success = await addToQueue(songId);

      if (success) {
        // Show success message
        const successMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          userId: localStorage.getItem("userId") || undefined,
          username: "System",
          message: `Added song to queue`,
          timestamp: new Date(),
          displayText: `✅ Added "${songTitle}" to queue`,
          isAnimating: false,
        };
        setChatMessages((prev) => [...prev, successMessage]);
      } else {
        // Show error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          userId: localStorage.getItem("userId") || undefined,
          username: "System",
          message: `Failed to add song`,
          timestamp: new Date(),
          displayText: `❌ Failed to add "${songTitle}" to queue`,
          isAnimating: false,
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Add to queue error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        userId: localStorage.getItem("userId") || undefined,
        username: "System",
        message: `Failed to add song`,
        timestamp: new Date(),
        displayText: `❌ Failed to add "${songTitle}" to queue`,
        isAnimating: false,
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    if (!socket || !isConnected || !isAuthenticated) {
      alert("Not connected to chat. Please refresh the page.");
      return;
    }

    const message = chatMessage.trim();

    // Check if this is a search command
    if (message.startsWith("/search ")) {
      const searchQuery = message.substring(8).trim(); // Remove "/search " prefix
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        alert("Please provide a search query after /search");
      }
      setChatMessage("");
      return;
    }

    // Send regular message via socket
    socket.emit("sendMessage", { message });
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
          <ScrollArea className="flex-grow mb-4 bg-muted/20 rounded border-2 border-foreground min-h-0 max-h-128">
            <div className="space-y-1 p-2 overflow-hidden">
              {chatMessages.map((msg, index) => {
                const showUserInfo = shouldShowUserInfo(msg, index);
                const avatarContent = getAvatarContent(
                  msg.avatarId,
                  msg.username
                );

                return (
                  <div
                    key={msg.id}
                    className={`${
                      showUserInfo ? "space-y-1 mt-3" : "mt-1"
                    } max-w-full`}
                  >
                    {showUserInfo && (
                      <div className="flex items-center space-x-2">
                        <Avatar className="size-6">
                          {avatarContent.src && (
                            <AvatarImage
                              src={avatarContent.src}
                              alt={`${msg.username}'s avatar`}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {avatarContent.fallback}
                          </AvatarFallback>
                        </Avatar>
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
                    )}
                    <div
                      className={`text-sm retro break-words overflow-wrap-anywhere word-break break-all max-w-full ${
                        showUserInfo ? "ml-8" : "ml-8"
                      }`}
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {msg.displayText}
                      {msg.isAnimating && (
                        <span className="animate-pulse">|</span>
                      )}

                      {/* Search Results */}
                      {msg.isSearchResult && msg.searchResults && (
                        <div className="mt-2 space-y-1">
                          {msg.searchResults.map((result) => {
                            const inQueue = isInQueue(result.id);
                            const adding = addingToQueue.has(result.id);

                            return (
                              <div
                                key={result.id}
                                className={`border border-foreground/20 rounded p-2 transition-colors ${
                                  inQueue
                                    ? "bg-green-500/20 border-green-500/50 cursor-not-allowed"
                                    : adding
                                    ? "bg-yellow-500/20 border-yellow-500/50 cursor-wait"
                                    : "hover:bg-muted/30 cursor-pointer"
                                }`}
                                onClick={() => {
                                  if (!inQueue && !adding) {
                                    handleAddToQueue(result.id, result.title);
                                  }
                                }}
                              >
                                <div className="text-xs retro text-primary">
                                  {result.artist} - {result.title}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {inQueue
                                    ? "✅ Already in queue"
                                    : adding
                                    ? "⏳ Adding to queue..."
                                    : "Click to add to queue"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="space-y-6 flex-shrink-0">
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
              disabled={
                !chatMessage.trim() ||
                !isConnected ||
                !isAuthenticated ||
                isSearching
              }
              className="w-full"
            >
              {!isConnected
                ? "Connecting..."
                : !isAuthenticated
                ? "Authenticating..."
                : isSearching
                ? "Searching..."
                : "Send Message"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
