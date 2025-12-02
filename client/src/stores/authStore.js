import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authAPI from '../features/auth/services/authAPI';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            loading: false,
            error: null,

            login: async (email, password) => {
                set({ loading: true, error: null });
                try {
                    const response = await authAPI.login({ email, password });
                    console.log('Login successful, token received:', response.token ? 'Yes' : 'No');
                    set({
                        user: response.user,
                        token: response.token,
                        loading: false
                    });
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.error || 'Login failed';
                    console.error('Login failed:', message);
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            register: async (userData) => {
                set({ loading: true, error: null });
                try {
                    await authAPI.register(userData);
                    // Auto login after register
                    return await get().login(userData.email, userData.password);
                } catch (error) {
                    const message = error.response?.data?.error || 'Registration failed';
                    set({ error: message, loading: false });
                    return { success: false, error: message };
                }
            },

            logout: () => {
                set({ user: null, token: null, error: null });
                localStorage.removeItem('auth-storage'); // Clear persist storage
            },

            updateUser: (updatedUser) => {
                set({ user: updatedUser });
            },

            isAuthenticated: () => !!get().token,
        }),
        {
            name: 'auth-storage', // unique name for localStorage key
            partialize: (state) => ({ user: state.user, token: state.token }), // only persist user and token
        }
    )
);

export default useAuthStore;
