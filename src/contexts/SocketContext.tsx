"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  authenticateUser: (userId: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:5000", {
      autoConnect: false,
    });

    newSocket.on("connect", () => {
      console.log("🔌 Connected to server:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from server");
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    newSocket.on("authSuccess", (data) => {
      console.log("✅ Authentication successful:", data);
      setIsAuthenticated(true);
    });

    newSocket.on("authError", (data) => {
      console.error("❌ Authentication failed:", data);
      setIsAuthenticated(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔌 Connection error:", error);
    });

    setSocket(newSocket);

    // Connect when component mounts
    newSocket.connect();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const authenticateUser = (userId: string) => {
    if (socket && isConnected) {
      console.log("🔐 Authenticating user:", userId);
      socket.emit("authenticateUser", { userId });
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    isAuthenticated,
    authenticateUser,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
