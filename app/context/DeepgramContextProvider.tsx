"use client";

import { createContext, useContext, useState, useRef, ReactNode, useCallback } from "react";
import { getAuthToken, sendKeepAliveMessage, sendSocketMessage, StsConfig } from "../utils/deepgramUtils";
import { agentConfig } from "../lib/agentConfig";

interface DeepgramContextType {
  socket: WebSocket | undefined;
  socketState: number;
  rateLimited: boolean;
  connectToDeepgram: () => Promise<void>;
  disconnectFromDeepgram: () => void;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

const DeepgramContextProvider = ({ children }: DeepgramContextProviderProps) => {
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [socketState, setSocketState] = useState(-1);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const keepAlive = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;

  const connectToDeepgram = useCallback(async () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("🔄 Already connected, skipping connection attempt");
      return;
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("Max reconnect attempts reached.");
      setRateLimited(true);
      return;
    }

    setSocketState(0); // connecting
    console.log("🔌 Attempting to connect to Deepgram Agent Converse...");

    try {
      const token = await getAuthToken();
      console.log("✅ Got auth token, establishing WebSocket connection...");
      
      // Use the working protocol approach from our tests
      const newSocket = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", [
        "bearer",
        token,
      ]);

      const onOpen = () => {
        setSocketState(1); // connected
        setReconnectAttempts(0);
        console.log("🎉 WebSocket connected to Deepgram Agent Converse!");
        
        keepAlive.current = setInterval(() => sendKeepAliveMessage(newSocket), 10000);
      };

      const onError = (err: Event) => {
        setSocketState(2); // error
        console.error("❌ Websocket error:", err);
        console.log("💡 This might indicate that Agent Converse is not enabled for your API key");
      };

      const onClose = (event: CloseEvent) => {
        if (keepAlive.current) {
          clearInterval(keepAlive.current);
        }
        setSocketState(3); // closed
        console.info(`🔌 WebSocket closed (Code: ${event.code}, Reason: ${event.reason})`);
        
        // Don't auto-reconnect if it's an auth error
        if (event.code === 1002 || event.code === 1003) {
          console.error("🚫 Authentication or protocol error - stopping reconnection attempts");
          setRateLimited(true);
          return;
        }
        
        console.info("🔄 Attempting to reconnect...");
        setTimeout(connectToDeepgram, 3000);
        setReconnectAttempts((attempts) => attempts + 1);
      };

      const onMessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📨 Received message from Deepgram:", message);
          
          if (message.type === 'SettingsApplied') {
            console.log("🎉 Agent Converse settings successfully applied!");
          } else if (message.type === 'Error') {
            console.error("❌ Agent Converse error:", message.description);
          } else if (message.type === 'Welcome') {
            console.log("👋 Welcome message received from Agent Converse");
          }
        } catch (err) {
          console.log("📨 Received non-JSON message from Deepgram:", event.data);
        }
      };

      newSocket.binaryType = "arraybuffer";
      newSocket.addEventListener("open", onOpen);
      newSocket.addEventListener("error", onError);
      newSocket.addEventListener("close", onClose);
      newSocket.addEventListener("message", onMessage);

      setSocket(newSocket);
    } catch (error) {
      console.error("❌ Failed to connect to Deepgram:", error);
      setSocketState(2);
    }
  }, [socket, reconnectAttempts, setSocketState, setReconnectAttempts, setRateLimited]);

  const disconnectFromDeepgram = () => {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      console.log("🔌 Manually disconnecting from Deepgram");
      socket.close();
    }
    setSocket(undefined);
    setSocketState(-1);
    if (keepAlive.current) {
      clearInterval(keepAlive.current);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        socket,
        socketState,
        rateLimited,
        connectToDeepgram,
        disconnectFromDeepgram,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram() {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error("useDeepgram must be used within a DeepgramContextProvider");
  }
  return context;
}

export { DeepgramContextProvider, useDeepgram };