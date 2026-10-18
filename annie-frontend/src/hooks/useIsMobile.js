import useWindowWidth from "./useWindowWidth";

// Ancho a partir del cual el panel usa el diseño de escritorio
export const MOBILE_BREAKPOINT = 768;

// true si la ventana mide menos de 768px (se actualiza al cambiar el tamaño)
export default function useIsMobile() {
  return useWindowWidth() < MOBILE_BREAKPOINT;
}
