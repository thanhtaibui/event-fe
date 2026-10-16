import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Đừng quên import CSS của toastify
import "./styles/App.css";
import { router } from "./routes/index"; // Đảm bảo router được import
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./hooks/auth/AuthProvider";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import { BookingCartProvider } from "./contexts/BookingCartContext";

function App() {
  return (
    <>
      <AuthProvider>
        <BookingCartProvider>
          <Suspense fallback={null}>
            <RouterProvider router={router} />
          </Suspense>
          <Toaster
            position="top-right"
            containerStyle={{
              zIndex: 18000,
            }}
            toastOptions={{
              style: {
                zIndex: 18000,
                fontSize: "16px",
                padding: "14px 18px",
                borderRadius: "10px",
              },
            }}
          />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={true}
            rtl={false}
            pauseOnFocusLoss={true}
            draggable={false}
            pauseOnHover={true}
            theme="light"
            transition={Slide}
          />
        </BookingCartProvider>
      </AuthProvider>
    </>
  );
}

export default App;
