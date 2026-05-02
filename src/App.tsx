import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Đừng quên import CSS của toastify
import "./styles/App.css";
import { router } from "./routes/index"; // Đảm bảo router được import
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./hooks/auth/AuthProvider";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "16px",
              padding: "14px 18px",
              borderRadius: "10px",
            },
          }}
        />
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
