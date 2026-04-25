import { useState } from "react";
export const useMainLayout = () => {
  const [active, setActive] = useState('dashboard');
  return { active, setActive };
}