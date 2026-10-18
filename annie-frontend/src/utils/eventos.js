// Eventos del navegador con los que las páginas del panel avisan a la barra
// superior y a la lateral que algo cambió, sin tener que recargar.

// Mi Negocio cambió el nombre, el logo o los datos del propietario
export const EVENTO_PERFIL = "annie:perfil-actualizado";

// Se creó, editó o eliminó un producto, cliente, venta o movimiento de crédito
export const EVENTO_DATOS = "annie:datos-actualizados";

export const avisarPerfilActualizado = () => window.dispatchEvent(new Event(EVENTO_PERFIL));
export const avisarDatosActualizados = () => window.dispatchEvent(new Event(EVENTO_DATOS));
