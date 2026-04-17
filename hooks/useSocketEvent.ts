import { useEffect, useRef } from 'react';

import { useSocket } from '../providers/SocketProvider';

export function useSocketEvent<TPayload = any>(
    eventName: string,
    handler: (payload: TPayload) => void,
    enabled = true
) {
    const { socket } = useSocket();
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!socket || !enabled) return;

        const listener = (payload: TPayload) => {
            handlerRef.current(payload);
        };

        socket.on(eventName, listener);
        return () => {
            socket.off(eventName, listener);
        };
    }, [enabled, eventName, socket]);
}
