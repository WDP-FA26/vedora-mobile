import { create } from 'zustand';

type TabBarVisibilityState = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

export const useTabBarVisibilityStore = create<TabBarVisibilityState>()((set) => ({
  visible: true,
  setVisible: (visible) => set((state) => state.visible === visible ? state : { visible }),
}));
