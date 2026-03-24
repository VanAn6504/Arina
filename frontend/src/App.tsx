import {BrowserRouter, Route, Router, Routes} from "react-router"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import ChatAppPage from "./pages/ChatAppPage"
import {Toaster} from "sonner"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { useThemeStore } from "./stores/useThemeStore"
import { useEffect } from "react"
// import { set } from "zod"
import { useAuthStore } from "./stores/useAuthStore"
import { useSocketStore } from "./stores/useSocketStore"
// import { u } from "node_modules/react-router/dist/development/index-react-server-client-EzWJGpN_.d.mts"


function App() {

  const {isDark, setTheme} = useThemeStore();
  const {accessToken} = useAuthStore();
  const {connectSocket, disconnectSocket} = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark, setTheme])

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }
    return () => { disconnectSocket() };
  }, [accessToken])

  return <>
  <Toaster richColors/>
    <BrowserRouter>
      <Routes>
        {/* public route */}
        <Route 
          path = "/SignIn"
          element = {<SignInPage/>}
        />

        <Route 
          path = "/SignUp" 
          element = {<SignUpPage/>}
        />

        {/* protectect routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={<ChatAppPage />}
            />
          </Route>
      </Routes>
    
    </BrowserRouter>
  </>
}

export default App
