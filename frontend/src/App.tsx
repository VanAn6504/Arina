import {BrowserRouter, Route, Router, Routes} from "react-router"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import ChatAppPage from "./pages/ChatAppPage"
import {Toaster} from "sonner"
import ProtectedRoute from "./components/auth/ProtectedRoute"


function App() {
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
