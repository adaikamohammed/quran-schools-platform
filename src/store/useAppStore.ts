import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    // Onboarding Tour State
    isTourPending: boolean;
    setTourPending: (pending: boolean) => void;
    tourStepIndex: number;
    setTourStepIndex: (index: number) => void;
    
    // Sidebar State (If needed later)
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            isTourPending: false, // Default is false, will be set to true for new users or upon request
            setTourPending: (pending) => set({ isTourPending: pending }),
            
            tourStepIndex: 0,
            setTourStepIndex: (index) => set({ tourStepIndex: index }),

            isSidebarCollapsed: false,
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
        }),
        {
            name: 'quran-app-storage',
            partialize: (state) => ({ 
                isSidebarCollapsed: state.isSidebarCollapsed 
            }),
            // We consciously decide NOT to persist isTourPending or tourStepIndex 
            // so if a user refreshes mid-tour, it remembers or restarts based on our logic elsewhere.
            // Wait: actually it's better to persist isTourPending if we want it to reliably continue.
            // But let's keep it simple for now as non-persisted state unless we specifically add it to partialize.
        }
    )
);
