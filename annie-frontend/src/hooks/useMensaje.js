import { useCallback, useEffect, useRef, useState } from "react";

// Mensaje de éxito que se borra solo después de unos segundos.
// Uso: const [success, mostrarExito] = useMensaje();
//      mostrarExito("Producto creado");  // se oculta a los 3 s
//      mostrarExito("");                 // lo oculta ya
// Cada mensaje nuevo reinicia el temporizador, y al desmontar la página se
// cancela para no actualizar un componente que ya no existe.
export default function useMensaje(duracion = 3000) {
  const [mensaje, setMensaje] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const mostrar = useCallback((msg) => {
    clearTimeout(timer.current);
    setMensaje(msg || "");
    if (msg) timer.current = setTimeout(() => setMensaje(""), duracion);
  }, [duracion]);

  return [mensaje, mostrar];
}
