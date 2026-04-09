import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right" 
          expand={false}
          richColors
          closeButton
          toastOptions={{
            className: 'dark:bg-slate-900 dark:text-white dark:border-slate-800',
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}