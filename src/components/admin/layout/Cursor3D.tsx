import { useEffect, useRef } from "react";
import { SVG3D } from "3dsvg";

// Định nghĩa SVG Content bên ngoài để tránh khởi tạo lại khi render
const MY_SVG_DATA = `<?xml version="1.0" standalone="no"?>
<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="50pt" height="50pt" viewBox="0 0 50 50">
<g transform="translate(0,50) scale(0.1,-0.1)" fill="#000000">
<path d="M201 436 c-49 -27 -63 -85 -34 -139 l18 -32 5 58 c4 42 11 63 25 73 47 35 95 -1 95 -71 0 -50 11 -58 28 -20 41 91 -51 179 -137 131z"/>
<path d="M54 385 c-8 -44 3 -105 19 -105 8 0 12 22 12 70 0 76 -19 98 -31 35z"/>
<path d="M415 350 c0 -76 19 -98 31 -35 8 44 -3 105 -19 105 -8 0 -12 -22 -12 -70z"/>
<path d="M106 394 c-8 -20 -8 -68 0 -88 11 -29 24 -5 24 44 0 49 -13 73 -24 44z"/>
<path d="M377 403 c-10 -10 -8 -101 2 -107 12 -8 21 18 21 57 0 35 -12 61 -23 50z"/>
<path d="M227 374 c-4 -4 -7 -57 -7 -118 l0 -110 -29 28 c-33 32 -65 31 -69 -1 -2 -16 11 -38 44 -73 l47 -51 81 3 81 3 14 73 c16 86 12 93 -58 111 l-50 13 -3 61 c-3 54 -6 62 -23 65 -12 2 -24 0 -28 -4z"/>
</g>
</svg>`;

export const Cursor3D = ({
  show,
  press,
}: {
  show: boolean;
  press?: boolean;
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);
  if (!show) return null;
  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "40px",
        height: "40px",
        pointerEvents: "none",
        zIndex: 9999,
        marginTop: "-20px",
        marginLeft: "-20px",
        willChange: "transform",
        cursor: `url('https://img.icons8.com/external-basicons-solid-edtgraphics/24/external-Touch-gesture-touch-gestures-basicons-solid-edtgraphics-16.png'), auto`,
        // press: mô phỏng cảm giác đè xuống (lún + dẹt nhẹ)
        transform: press
          ? "translate3d(0px, 0px, 0) scale(0.88) translateY(6px)"
          : undefined,
        transition: "transform 500ms cubic-bezier(0.1, 1.5, 0, 1.5)",
      }}
    >
      <SVG3D
        svg={MY_SVG_DATA}
        depth={1.5}
        smoothness={0.5}
        color="#5917be"
        metalness={0.7}
        roughness={0.3}
        animate={press ? "none" : "float"}
        animateSpeed={press ? 0 : 1}
        zoom={press ? 6.2 : 6}
      />
    </div>
  );
};
