import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';

export function useWebSocket(topic: string, onMessageReceived: () => void) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onMessageReceived);

  useEffect(() => {
    callbackRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      debug: function (str) {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function () {
      setIsConnected(true);
      client.subscribe(topic, (message) => {
        if (message.body === 'UPDATE') {
          callbackRef.current();
        }
      });
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
