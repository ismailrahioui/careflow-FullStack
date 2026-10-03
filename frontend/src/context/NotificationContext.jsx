import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play a soft pleasant two-tone chime via Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2 (higher harmony)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1); // A5
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }, [soundEnabled]);

  // Load recent notifications from API
  const fetchRecentNotifications = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      const res = await api.get(`/clinics/${user.clinicId}/notifications/recent`);
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.read).length);
      }
    } catch (err) {
      // Soft fail
    }
  }, [user?.clinicId]);

  useEffect(() => {
    if (!user?.clinicId) return;
    fetchRecentNotifications();

    // Setup SSE connection
    let eventSource = null;
    try {
      const streamUrl = `http://localhost:8080/api/clinics/${user.clinicId}/notifications/stream?token=${encodeURIComponent(user.token || '')}`;
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('NOTIFICATION', (event) => {
        try {
          const notificationData = JSON.parse(event.data);
          
          // Add to top of list
          setNotifications(prev => [notificationData, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show floating toast
          setActiveToast(notificationData);

          // Play sound
          playNotificationSound();

          // Dispatch custom window event so Dashboard can re-fetch
          window.dispatchEvent(new CustomEvent('careflow-realtime-update', { detail: notificationData }));
        } catch (err) {
          console.error('Error parsing SSE notification', err);
        }
      });

      eventSource.onerror = (err) => {
        // EventSource will automatically attempt to reconnect
      };
    } catch (e) {
      console.warn('SSE subscription failed', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user?.clinicId, user?.token, playNotificationSound, fetchRecentNotifications]);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      activeToast,
      markAllAsRead,
      dismissToast,
      soundEnabled,
      setSoundEnabled
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
