import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";
import useIsMobile from "../../hooks/useIsMobile";
import useMensaje from "../../hooks/useMensaje";
import { formatFechaDia, fullName, initials } from "../../utils/format";
import { PASSWORD_REGEX } from "../../utils/constantes";

// Empleados del negocio (solo el dueño entra a esta página). Cada empleado
// inicia sesión con su propio correo y contraseña y trabaja con los datos del
// negocio del dueño, con menos permisos.

const camposIniciales = { name: "", lastName: "", email: "", password: "", confirmPassword: "" };

// Lo que puede y lo que no puede hacer un empleado (mismas reglas que el backend)
const PUEDE = [
  "Registrar ventas",
  "Ver productos e inventario",
  "Dar de alta y editar clientes",
  "Registrar abonos de créditos",
];
const NO_PUEDE = [
  "Crear, editar o eliminar productos, ni ver sus costos",
  "Cancelar ventas",
  "Eliminar clientes",
  "Cambiar créditos (límites y cargos)",
  "Ver reportes",
  "Editar los datos del negocio",
  "Administrar empleados",
];

// Un empleado sin el campo "activo" se toma como activo
const estaActivo = (emp) => emp.activo !== false;

// Misma validación y mismos mensajes que el registro de cuenta (Register.jsx).
// Regresa el mensaje de error, o null si la contraseña sirve.
const errorPassword = (password, confirmacion) => {
  if (password !== confirmacion) return "Las contraseñas no coinciden";
  if (!PASSWORD_REGEX.test(password))
    return "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial";
  return null;
};

const Empleados = () => {
  const [empleados, setEmpleados]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(camposIniciales);
  const [editId, setEditId]         = useState(null); // al editar solo cambian nombre y apellido
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState("");
  const [success, mostrarExito]     = useMensaje();
  const [hoveredRow, setHoveredRow] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null); // empleado a eliminar
  // Modal para cambiar la contraseña de un empleado
  const [passModal, setPassModal]   = useState(null); // empleado
  const [passForm, setPassForm]     = useState({ password: "", confirmPassword: "" });
  const [passError, setPassError]   = useState("");
  const [showPassModal, setShowPassModal] = useState(false);
  // true mientras se guarda, activa/desactiva o elimina (evita mandarlo dos veces)
  const [guardando, setGuardando]   = useState(false);
  const isMobile = useIsMobile();

  const cargar = async () => {
    try {
      const res = await axios.get("/employees");
      setEmpleados(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar los empleados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const cerrarForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(camposIniciales);
    setShowPass(false);
  };

  const abrirNuevo = () => {
    setForm(camposIniciales);
    setEditId(null);
    setShowPass(false);
    setShowForm(true);
    setError(""); mostrarExito("");
  };

  const handleEditar = (emp) => {
    setForm({ ...camposIniciales, name: emp.name || "", lastName: emp.lastName || "", email: emp.email || "" });
    setEditId(emp._id);
    setShowForm(true);
    setError(""); mostrarExito("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando) return; // ya hay un guardado en camino
    setError(""); mostrarExito("");

    const datos = { name: form.name.trim(), lastName: form.lastName.trim() };
    if (!datos.name || !datos.lastName) return setError("El nombre y el apellido son obligatorios");
    if (!editId) {
      const errorPass = errorPassword(form.password, form.confirmPassword);
      if (errorPass) return setError(errorPass);
    }

    setGuardando(true);
    try {
      if (editId) {
        await axios.put(`/employees/${editId}`, datos);
        mostrarExito("Empleado actualizado correctamente");
      } else {
        await axios.post("/employees", { ...datos, email: form.email.trim(), password: form.password });
        mostrarExito("Empleado agregado: ya puede iniciar sesión con su correo y contraseña");
      }
      cerrarForm();
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el empleado");
    } finally {
      setGuardando(false);
    }
  };

  // Un empleado desactivado ya no puede iniciar sesión, y si tenía la sesión
  // abierta, la pierde en su siguiente acción
  const handleActivo = async (emp) => {
    if (guardando) return;
    const activar = !estaActivo(emp);
    setGuardando(true);
    setError(""); mostrarExito("");
    try {
      await axios.put(`/employees/${emp._id}`, { activo: activar });
      mostrarExito(activar
        ? `Se activó a ${fullName(emp)}: ya puede volver a entrar a Annie`
        : `Se desactivó a ${fullName(emp)}: ya no puede entrar a Annie`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al cambiar el acceso del empleado");
    } finally {
      setGuardando(false);
    }
  };

  // ── Cambiar contraseña ──────────────────────────────────────────
  const abrirPassModal = (emp) => {
    setPassModal(emp);
    setPassForm({ password: "", confirmPassword: "" });
    setPassError("");
    setShowPassModal(false);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (guardando) return; // ya hay un guardado en camino
    setPassError("");
    const errorPass = errorPassword(passForm.password, passForm.confirmPassword);
    if (errorPass) return setPassError(errorPass);

    setGuardando(true);
    try {
      await axios.put(`/employees/${passModal._id}`, { password: passForm.password });
      setError("");
      mostrarExito(`Contraseña de ${fullName(passModal)} actualizada`);
      setPassModal(null);
    } catch (err) {
      setPassError(err.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  };

  // Las ventas que registró el empleado conservan su nombre
  const handleEliminar = async () => {
    if (guardando || !confirmEliminar) return;
    const emp = confirmEliminar;
    setGuardando(true);
    setError(""); mostrarExito("");
    try {
      const res = await axios.delete(`/employees/${emp._id}`);
      mostrarExito(res.data?.message || "Empleado eliminado");
      if (editId === emp._id) cerrarForm(); // se estaba editando al que se eliminó
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar el empleado");
    } finally {
      setConfirmEliminar(null);
      setGuardando(false);
    }
  };

  // KPIs
  const activos   = empleados.filter(estaActivo).length;
  const inactivos = empleados.length - activos;

  // Botones de cada empleado (los mismos en la tarjeta móvil y en la tabla)
  const botones = (emp, extra = {}) => {
    const activo = estaActivo(emp);
    return (
      <>
        <button style={{ ...styles.btnEdit, ...extra }} onClick={() => handleEditar(emp)}>
          <i className="fa fa-pencil" style={{ marginRight: 5 }} />Editar
        </button>
        <button
          style={{ ...(activo ? styles.btnDesactivar : styles.btnActivar), ...extra, ...(guardando ? styles.btnDisabled : {}) }}
          onClick={() => handleActivo(emp)} disabled={guardando}
          title={activo ? "Quitarle el acceso a Annie" : "Devolverle el acceso a Annie"}>
          <i className={`fa ${activo ? "fa-ban" : "fa-check-circle"}`} style={{ marginRight: 5 }} />
          {activo ? "Desactivar" : "Activar"}
        </button>
        <button style={{ ...styles.btnEdit, ...extra }} onClick={() => abrirPassModal(emp)}>
          <i className="fa fa-key" style={{ marginRight: 5 }} />Contraseña
        </button>
        <button style={{ ...styles.btnDelete, ...extra }} onClick={() => setConfirmEliminar(emp)}>
          <i className="fa fa-trash" style={{ marginRight: 5 }} />Eliminar
        </button>
      </>
    );
  };

  const badgeEstado = (emp) => (estaActivo(emp) ? (
    <span style={styles.badgeActivo}>
      <i className="fa fa-circle" style={{ fontSize: 7, marginRight: 5 }} />Activo
    </span>
  ) : (
    <span style={styles.badgeInactivo}>
      <i className="fa fa-circle-o" style={{ fontSize: 7, marginRight: 5 }} />Inactivo
    </span>
  ));

  const fechaAlta = (emp) => (emp.createdAt ? formatFechaDia(emp.createdAt) : "—");

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <i className="fa fa-user-times" style={{ color: "#e05555", fontSize: 24 }} />
            </div>
            <h5 style={{ margin: "0 0 6px", color: "#1a1a2e", fontSize: 16 }}>
              ¿Eliminar a {fullName(confirmEliminar)}?
            </h5>
            <p style={{ margin: "0 0 8px", color: "#888", fontSize: 13 }}>
              Ya no podrá entrar a Annie y esta acción no se puede deshacer.
              Las ventas que registró conservan su nombre.
            </p>
            <p style={{ margin: "0 0 20px", color: "#888", fontSize: 13 }}>
              Si solo quieres quitarle el acceso por un tiempo, mejor desactívalo.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={styles.btnModalCancel} onClick={() => setConfirmEliminar(null)} disabled={guardando}>
                Cancelar
              </button>
              <button style={{ ...styles.btnModalDelete, ...(guardando ? styles.btnDisabled : {}) }}
                onClick={handleEliminar} disabled={guardando}>
                <i className={`fa ${guardando ? "fa-spinner fa-spin" : "fa-trash"}`} style={{ marginRight: 7 }} />
                {guardando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {passModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 400 }}>
            <div style={{ ...styles.modalIcon, background: "#f0f2ff" }}>
              <i className="fa fa-key" style={{ color: "#6372ff", fontSize: 22 }} />
            </div>
            <h5 style={{ margin: "0 0 4px", color: "#1a1a2e", fontSize: 16 }}>Cambiar contraseña</h5>
            <p style={{ margin: "0 0 16px", color: "#888", fontSize: 13, overflowWrap: "anywhere" }}>
              {fullName(passModal)}{passModal.email ? ` · ${passModal.email}` : ""}
            </p>
            <form onSubmit={submitPassword} style={{ textAlign: "left" }}>
              <label style={styles.label}><i className="fa fa-lock" style={styles.labelIcon} />Contraseña nueva *</label>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input
                  style={{ ...styles.input, paddingRight: 40 }}
                  type={showPassModal ? "text" : "password"}
                  name="password" autoFocus required autoComplete="new-password"
                  placeholder="Mín. 8 caracteres, 1 mayús., 1 número, 1 especial"
                  value={passForm.password}
                  onChange={(e) => setPassForm((p) => ({ ...p, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPassModal((p) => !p)} style={styles.eyeBtn}
                  title={showPassModal ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  <i className={`fa ${showPassModal ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
              <label style={styles.label}><i className="fa fa-lock" style={styles.labelIcon} />Confirmar contraseña *</label>
              <input
                style={{
                  ...styles.input,
                  borderColor: passForm.confirmPassword && passForm.confirmPassword !== passForm.password ? "#e05555" : "#e8e8e8",
                }}
                type={showPassModal ? "text" : "password"}
                name="confirmPassword" required autoComplete="new-password"
                placeholder="Repite la contraseña"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
              <div style={styles.hint}>
                Compártela con tu empleado: la necesitará la próxima vez que inicie sesión.
              </div>
              {passError && (
                <div style={{ ...styles.alertError, marginTop: 10, fontSize: 13 }}>
                  <i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{passError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18, flexWrap: "wrap" }}>
                <button type="button" style={styles.btnModalCancel} onClick={() => setPassModal(null)} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" style={{ ...styles.btnSuccess, ...(guardando ? styles.btnDisabled : {}) }} disabled={guardando}>
                  <i className={`fa ${guardando ? "fa-spinner fa-spin" : "fa-check"}`} style={{ marginRight: 7 }} />
                  {guardando ? "Guardando..." : "Guardar contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, color: "#1a1a2e", fontSize: isMobile ? 16 : 18 }}>
            <i className="fa fa-id-badge" style={{ color: "#6372ff", marginRight: 10 }} />
            Empleados
          </h4>
          <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 13 }}>
            {empleados.length} empleado{empleados.length !== 1 ? "s" : ""} registrado{empleados.length !== 1 ? "s" : ""}
          </p>
        </div>
        {showForm ? (
          <button style={styles.btnCancel} onClick={cerrarForm}>
            <i className="fa fa-times" style={{ marginRight: 8 }} />Cancelar
          </button>
        ) : (
          <button style={styles.btnPrimary} onClick={abrirNuevo}>
            <i className="fa fa-user-plus" style={{ marginRight: 8 }} />Agregar empleado
          </button>
        )}
      </div>

      {error   && <div style={styles.alertError}><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{error}</div>}
      {success && <div style={styles.alertSuccess}><i className="fa fa-check-circle" style={{ marginRight: 8 }} />{success}</div>}

      {/* Qué puede y qué no puede hacer un empleado */}
      <div style={styles.infoCard}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <i className="fa fa-info-circle" style={{ color: "#6372ff", fontSize: 18, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
            Cada empleado entra a Annie con su propio correo y contraseña y trabaja con los datos de tu negocio.
            Las ventas que registra quedan a su nombre.
          </div>
        </div>
        <div className="dash-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ ...styles.infoBox, background: "#f0fff4", borderColor: "#b7f0cc" }}>
            <div style={{ ...styles.infoTitulo, color: "#1a7c40" }}>
              <i className="fa fa-check-circle" style={{ marginRight: 6 }} />Puede
            </div>
            {PUEDE.map((t) => (
              <div key={t} style={styles.infoItem}>
                <i className="fa fa-check" style={{ ...styles.infoIcon, color: "#27ae60" }} />{t}
              </div>
            ))}
          </div>
          <div style={{ ...styles.infoBox, background: "#fff0f3", borderColor: "#ffd0d8" }}>
            <div style={{ ...styles.infoTitulo, color: "#e05555" }}>
              <i className="fa fa-ban" style={{ marginRight: 6 }} />No puede
            </div>
            {NO_PUEDE.map((t) => (
              <div key={t} style={styles.infoItem}>
                <i className="fa fa-times" style={{ ...styles.infoIcon, color: "#e05555" }} />{t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {empleados.length > 0 && (
        <div className="dash-kpi-grid" style={styles.kpiGrid}>
          {[
            { icon: "fa-id-badge",     bg: "#f0f2ff", color: "#6372ff", val: empleados.length, label: "Total empleados" },
            { icon: "fa-check-circle", bg: "#e8f5e9", color: "#27ae60", val: activos,          label: "Activos"         },
            { icon: "fa-ban",          bg: "#fff0f3", color: "#e05555", val: inactivos,        label: "Inactivos"       },
          ].map(({ icon, bg, color, val, label }) => (
            <div key={label} style={styles.kpiCard}>
              <div style={{ ...styles.kpiIcon, background: bg }}>
                <i className={`fa ${icon}`} style={{ color, fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.1 }}>{val}</div>
                <div style={{ fontSize: 11, color: "#9599b3", marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario alta / edición */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <i className={`fa ${editId ? "fa-pencil" : "fa-user-plus"}`} style={{ color: "#6372ff", fontSize: 18 }} />
            <h5 style={{ margin: 0, color: "#1a1a2e" }}>{editId ? "Editar empleado" : "Agregar empleado"}</h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="dash-form-grid" style={styles.formGrid}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-user" style={styles.labelIcon} />Nombre *
                </label>
                <input style={styles.input} name="name" value={form.name}
                  onChange={handleChange} required placeholder="Ej: María" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-user" style={styles.labelIcon} />Apellido *
                </label>
                <input style={styles.input} name="lastName" value={form.lastName}
                  onChange={handleChange} required placeholder="Ej: Pérez" />
              </div>
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-envelope" style={styles.labelIcon} />Correo electrónico *
                </label>
                {editId ? (
                  <>
                    <input style={{ ...styles.input, background: "#f0f2ff", cursor: "not-allowed" }}
                      value={form.email} disabled />
                    <span style={styles.hint}>El correo no se puede cambiar</span>
                  </>
                ) : (
                  <input style={styles.input} name="email" type="email" value={form.email}
                    onChange={handleChange} required autoComplete="off" placeholder="Ej: maria@correo.com" />
                )}
              </div>

              {/* Contraseña: solo al agregar (después se cambia con "Contraseña") */}
              {!editId && (
                <>
                  <div style={styles.fieldWrap}>
                    <label style={styles.label}>
                      <i className="fa fa-lock" style={styles.labelIcon} />Contraseña *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        style={{ ...styles.input, paddingRight: 40 }}
                        type={showPass ? "text" : "password"}
                        name="password" value={form.password} onChange={handleChange}
                        required autoComplete="new-password"
                        placeholder="Mín. 8 caracteres, 1 mayús., 1 número, 1 especial"
                      />
                      <button type="button" onClick={() => setShowPass((p) => !p)} style={styles.eyeBtn}
                        title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
                        <i className={`fa ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
                      </button>
                    </div>
                  </div>
                  <div style={styles.fieldWrap}>
                    <label style={styles.label}>
                      <i className="fa fa-lock" style={styles.labelIcon} />Confirmar contraseña *
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        borderColor: form.confirmPassword && form.confirmPassword !== form.password ? "#e05555" : "#e8e8e8",
                      }}
                      type={showPass ? "text" : "password"}
                      name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                      required autoComplete="new-password"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                </>
              )}
            </div>

            {!editId && (
              <div style={{ ...styles.hint, marginTop: 12 }}>
                <i className="fa fa-info-circle" style={{ color: "#6372ff", marginRight: 6 }} />
                Tu empleado entrará a Annie con este correo y esta contraseña; no olvides compartírselos.
              </div>
            )}

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button type="submit" style={{ ...styles.btnSuccess, ...(guardando ? styles.btnDisabled : {}) }} disabled={guardando}>
                <i className={`fa ${guardando ? "fa-spinner fa-spin" : editId ? "fa-save" : "fa-check"}`} style={{ marginRight: 8 }} />
                {guardando ? "Guardando..." : editId ? "Guardar cambios" : "Agregar empleado"}
              </button>
              <button type="button" style={styles.btnCancel} onClick={cerrarForm}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista / Empty state */}
      {empleados.length === 0 ? (
        <div style={styles.empty}>
          <i className="fa fa-id-badge" style={{ fontSize: 40, color: "#d0d4ff", display: "block", marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: "#555", marginBottom: 4 }}>Aún no tienes empleados</div>
          <div style={{ color: "#aaa", fontSize: 13 }}>Agrega a quien te ayuda en el negocio con el botón de arriba</div>
        </div>
      ) : isMobile ? (
        /* Vista cards en móvil */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {empleados.map((emp) => (
            <div key={emp._id} style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={styles.avatar}>{initials(emp)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ color: "#1a1a2e", fontSize: 14 }}>{fullName(emp)}</strong>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <i className="fa fa-envelope" style={{ color: "#6372ff", fontSize: 10, marginRight: 5 }} />{emp.email}
                  </div>
                </div>
                {badgeEstado(emp)}
              </div>
              <div style={{ fontSize: 12, color: "#9599b3", marginBottom: 12 }}>
                <i className="fa fa-calendar" style={{ marginRight: 5 }} />Alta: {fechaAlta(emp)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {botones(emp, { width: "100%", padding: "8px 10px" })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dash-table-wrap" style={styles.tableCard}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                <th style={styles.th}>Empleado</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Alta</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp._id}
                  onMouseEnter={() => setHoveredRow(emp._id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: hoveredRow === emp._id ? "#f8f9ff" : "transparent",
                    transition: "background 0.12s",
                  }}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={styles.avatar}>{initials(emp)}</div>
                      <strong style={{ color: "#1a1a2e", fontSize: 14 }}>{fullName(emp)}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#555", fontSize: 13 }}>
                      <i className="fa fa-envelope" style={{ color: "#6372ff", fontSize: 12 }} />
                      {emp.email}
                    </span>
                  </td>
                  <td style={styles.td}>{badgeEstado(emp)}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: "#9599b3", whiteSpace: "nowrap" }}>{fechaAlta(emp)}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {botones(emp)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Base de los botones chicos de cada empleado
const botonFila = {
  borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
  fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center",
};

const styles = {
  btnPrimary: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "flex", alignItems: "center",
  },
  btnSuccess: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "flex", alignItems: "center",
  },
  btnCancel: {
    background: "#fff", color: "#e05555", border: "1.5px solid #ffd0d8",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  btnEdit:       { ...botonFila, background: "#f4f6ff", color: "#6372ff", border: "1px solid #c8ccff" },
  btnActivar:    { ...botonFila, background: "#f0fff4", color: "#1a7c40", border: "1px solid #b7f0cc" },
  btnDesactivar: { ...botonFila, background: "#fff8e1", color: "#e08c00", border: "1px solid #ffe082" },
  btnDelete:     { ...botonFila, background: "#fff0f3", color: "#e05555", border: "1px solid #ffd0d8" },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 15, padding: 4,
  },
  badgeActivo: {
    display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    color: "#1a7c40", background: "#f0fff4", border: "1px solid #b7f0cc", borderRadius: 20, padding: "3px 10px",
  },
  badgeInactivo: {
    display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    color: "#888", background: "#f4f6f9", border: "1px solid #e0e0e0", borderRadius: 20, padding: "3px 10px",
  },
  infoCard: {
    background: "#fff", borderRadius: 12, padding: 18,
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1.5px solid #eef0ff",
  },
  infoBox: { border: "1.5px solid", borderRadius: 10, padding: "12px 14px" },
  infoTitulo: {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
    display: "flex", alignItems: "center",
  },
  infoItem: { display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "#1a1a2e", padding: "3px 0" },
  infoIcon: { fontSize: 11, width: 14, flexShrink: 0, marginTop: 4 },
  hint: { fontSize: 11, color: "#9599b3", marginTop: 6, display: "block" },
  formCard: {
    background: "#fff", borderRadius: 12, padding: 24,
    boxShadow: "0 2px 16px rgba(99,114,255,0.1)", border: "1.5px solid #e8eaff",
  },
  formHeader: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
    paddingBottom: 14, borderBottom: "1px solid #f0f0f0",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  fieldWrap: { display: "flex", flexDirection: "column" },
  label: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  labelIcon: { color: "#6372ff", fontSize: 12 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8",
    fontSize: 14, color: "#1a1a2e", fontWeight: 600, outline: "none",
    boxSizing: "border-box", background: "#fafafa", transition: "border-color 0.2s",
  },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  kpiCard: {
    background: "#fff", borderRadius: 12, padding: "14px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12,
  },
  kpiIcon: {
    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  card: { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  tableCard: {
    background: "#fff", borderRadius: 12, overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  th: {
    padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#888",
    fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
  },
  td: { padding: "12px 16px", fontSize: 13, verticalAlign: "middle", color: "#1a1a2e", fontWeight: 600 },
  avatar: {
    width: 38, height: 38, borderRadius: "50%",
    background: "linear-gradient(135deg, #6372ff, #5ca9fb)",
    color: "#fff", fontWeight: 700, fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  empty: {
    background: "#fff", borderRadius: 12, padding: "50px 30px",
    textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  alertError:   { background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8, border: "1px solid #ffd0d8", display: "flex", alignItems: "center" },
  alertSuccess: { background: "#f0fff4", color: "#1a7c40", padding: "10px 16px", borderRadius: 8, border: "1px solid #b7f0cc", display: "flex", alignItems: "center" },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 999,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 340, width: "90%",
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)", textAlign: "center", boxSizing: "border-box",
  },
  modalIcon: {
    width: 56, height: 56, borderRadius: "50%", background: "#fff0f3",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  btnModalCancel: {
    background: "#f4f6f9", color: "#666", border: "1px solid #e0e0e0",
    borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnModalDelete: {
    background: "linear-gradient(to right, #e74c3c, #c0392b)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
};

export default Empleados;
