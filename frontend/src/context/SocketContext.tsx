import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  notifications: any[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      return;
    }

    const socketUrl = 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token }
    });

    setSocket(newSocket);
    fetchNotifications();

    newSocket.on('connect', () => {
      console.log('⚡ Connected to socket server');
    });

    newSocket.on('receive_message', (msg: any) => {
      // Whenever a chat message arrives, fetch/update notifications or refresh chat
      // We can also trigger a notification update
      fetchNotifications();
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Disconnected from socket server');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, fetchNotifications, markAsRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
