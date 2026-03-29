import { useEffect, useCallback, useRef } from 'react';
import { wsService } from '@/services/websocket';
import { useToast } from '@/hooks/use-toast';
import type { WsOutgoingMessage, WsErrorData } from '@/types/websocket';

interface UseWebSocketOptions {
  onMessage?: Record<string, (data: Record<string, unknown>) => void>;
  onError?: (error: WsErrorData) => void;
  autoConnect?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { toast } = useToast();
  const { onMessage = {}, onError, autoConnect = true } = options;
  const handlersRef = useRef(onMessage);

  useEffect(() => {
    handlersRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!autoConnect) return;

    const handlers = handlersRef.current;
    const cleanups: Array<() => void> = [];

    Object.entries(handlers).forEach(([type, handler]) => {
      cleanups.push(wsService.onMessage(type, handler));
    });

    const errorHandler = (data: WsErrorData) => {
      if (onError) {
        onError(data);
      } else if (!data.message?.includes('Unknown message type')) {
        toast({
          title: "Error",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }
    };

    cleanups.push(wsService.onMessage('error', errorHandler));

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [autoConnect, onError, toast]);

  const send = useCallback((message: WsOutgoingMessage) => {
    wsService.send(message);
  }, []);

  const isConnected = useCallback(() => {
    return wsService.isConnected();
  }, []);

  return { send, isConnected };
};
