import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';

export function useWebSocket(topic: string, onMessageReceived: () => void) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onMessageReceived);

  useEffect(() => {
    callbackRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    const token = localStorage.getItem('@HabitOS:token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const client = new Client({
      brokerURL: `${wsProtocol}://${window.location.hostname}:8080/ws`,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function () {
      setIsConnected(true);
      if (topic) {
        client.subscribe(topic, (message) => {
          if (message.body === 'UPDATE') {
            callbackRef.current();
          }
        });
      }
    };

    client.onStompError = function (frame) {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [topic]);

  return isConnected;
}
