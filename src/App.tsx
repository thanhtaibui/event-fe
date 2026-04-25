import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Đừng quên import CSS của toastify
import "./styles/App.css";
import { router } from "./routes/index"; // Đảm bảo router được import
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./hooks/auth/AuthProvider";

function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Slide}
        />
      </AuthProvider>
    </>
  );
}

export default App;
