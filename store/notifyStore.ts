import { NotificationCouple } from '@/types/couples.interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type NotificationState = {
  notifications: NotificationCouple[];
  addNotification: (notification: NotificationCouple) => void;
  addNotifications: (notifications: NotificationCouple[]) => void;
  removeNotification: (notification: NotificationCouple) => void;
  clearNotifications: () => void;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),

      addNotifications: (notifications) =>
        set((state) => ({
          notifications: [...notifications],
        })),

      removeNotification: (notification) =>
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => n.message !== notification.message
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
