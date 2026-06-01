import { useEffect, useRef } from "react";
import LoginForm from "../../components/auth/LoginForm";
import { toast } from "react-hot-toast";
export default function LoginPage() {
  const isToasted = useRef(false);

  useEffect(() => {
    if (isToasted.current) return;
    const pendingMessage = sessionStorage.getItem("TOAST_MESSAGE");

    if (pendingMessage) {
      isToasted.current = true;
      toast.error(pendingMessage);
      sessionStorage.removeItem("TOAST_MESSAGE");
    }
  }, []);
  return <LoginForm />;
}
