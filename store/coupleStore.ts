import { InviteData } from '@/types/couples.interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CoupleState = {
  data: InviteData | null; // pode ser null inicialmente
  coupleId: String;
  setCoupleId: (id: String) => void;
  setInvite: (data: InviteData) => void;
  clearInvite: () => void; // opcional, para limpar o invite
};

export const useCoupleStore = create<CoupleState>()(
  persist(
    (set) => ({
      data: null,
      coupleId: "",
      setCoupleId: (coupleId: String) => set({ coupleId: coupleId }),
      setInvite: (data: InviteData) => set({ data }),
      clearInvite: () => set({ data: null }),
    }),
    {
      name: 'couple-storage', // nome no AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
