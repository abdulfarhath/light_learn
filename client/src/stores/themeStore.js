import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'dark', // Default to dark mode
            toggleTheme: () =>
                set((state) => {
                    const newTheme = state.theme === 'light' ? 'dark' : 'light';
                    // Update the DOM immediately
                    if (newTheme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    return { theme: newTheme };
                }),
            setTheme: (theme) => {
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                set({ theme });
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                // Ensure DOM matches state on rehydration
                if (state?.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
        }
    )
);

export default useThemeStore;
