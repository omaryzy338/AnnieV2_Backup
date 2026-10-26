import { useEffect, useState } from "react";
import { EVENTO_PERFIL } from "../utils/eventos";
import { esDueno, leerUsuario } from "../utils/sesion";

// Usuario de la sesión y si es el dueño del negocio.
// Uso: const { user, esDueno } = useSesion();
//      {esDueno && <button>Eliminar</button>}
// Se vuelve a leer cuando una pantalla avisa que cambió el perfil
// (EVENTO_PERFIL), por ejemplo cuando la barra lateral trae del backend el
// rol de una sesión antigua que no lo tenía guardado.
export default function useSesion() {
  const [user, setUser] = useState(leerUsuario);

  useEffect(() => {
    const releer = () => setUser(leerUsuario());
    window.addEventListener(EVENTO_PERFIL, releer);
    return () => window.removeEventListener(EVENTO_PERFIL, releer);
  }, []);

  return { user, esDueno: esDueno(user) };
}
