import type { ThemeState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";//luu state vao localStorage nó sẽ tự động đồng bộ giá trị state với
// local storage. Khi người dùng tải lại trang, nó sẽ lấy giá trị từ local storage và khôi phục lại state của ứng dụng. 
// giúp duy trì trạng thái của ứng dụng ngay cả khi người dùng đóng trình duyệt hoặc tải lại trang.

export const useThemeStore = create<ThemeState>()(
    persist(
        (set,get) => ({
            isDark: false,

            toggleTheme: () => {
                const newValue = !get().isDark;
                set({ isDark: newValue });
                
                if (newValue) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }

            },

            setTheme: (dark: boolean) => {
                set({ isDark: dark });
                if (dark) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            }
        }),
        {
            name: "theme-storage", //key dc luu trong localStorage(co gia tri la sang hay toi)
        }
    )
)
