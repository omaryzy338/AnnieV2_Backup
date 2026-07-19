import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axiosConfig";
import useWindowWidth from "../../hooks/useWindowWidth";

// Validación de RFC en el cliente (espejo del backend) para feedback instantáneo
const RFC_FISICA = /^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;
const RFC_MORAL  = /^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;

const limpiarRFC = (r) => String(r || "").toUpperCase().replace(/[\s-]/g, "");
const rfcValido = (rfc, tipo) => {
  const c = limpiarRFC(rfc);
  if (tipo === "fisica") return RFC_FISICA.test(c);
  if (tipo === "moral")  return RFC_MORAL.test(c);
  return RFC_FISICA.test(c) || RFC_MORAL.test(c);
};

const money = (n) => "$" + Number(n || 0).toFixed(2);

const formInicial = {
  name: "", lastName: "", tipoPersona: "fisica", rfc: "",
  razonSocial: "", email: "", phone: "", limiteCredito: "",
};

const Creditos = () => {
  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen]   = useState(null);
  const [rfcGenerico, setRfcGenerico] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(formInicial);
  const [editId, setEditId]     = useState(null);

  // Modales de movimiento: { cliente, tipo: 'cargo' | 'abono' }
  const [movModal, setMovModal] = useState(null);
  const [movForm, setMovForm]   = useState({ amount: "", description: "" });
  const [movError, setMovError] = useState("");

  // Panel de estado de cuenta
  const [estadoCuenta, setEstadoCuenta] = useState(null); // { client, movimientos }

  const w = useWindowWidth();
  const isMobile = w < 768;

  const cargar = async () => {
    try {
      const [rc, rr, rp] = await Promise.all([
        axios.get("/credits"),
        axios.get("/credits/resumen"),
        axios.get("/profile"),
      ]);
      setClientes(rc.data);
      setResumen(rr.data);
      setRfcGenerico(!!rp.data.business?.rfcGenerico);
    } catch {
      setError("Error al cargar los créditos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  // ── Alta / edición de cliente de crédito ────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const abrirNuevo = () => {
    setForm(formInicial);
    setEditId(null);
    setShowForm(true);
    setError(""); setSuccess("");
  };

  const abrirEditar = (c) => {
    setForm({
      name: c.name || "",
      lastName: c.lastName || "",
      tipoPersona: c.tipoPersona || "fisica",
      rfc: c.rfc || "",
      razonSocial: c.razonSocial || "",
      email: c.email || "",
      phone: c.phone || "",
      limiteCredito: c.limiteCredito != null ? String(c.limiteCredito) : "",
    });
    setEditId(c._id);
    setShowForm(true);
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    // Validaciones cliente-side
    if (!form.name.trim()) return setError("El nombre es obligatorio");
    if (!form.rfc.trim())  return setError("El RFC es obligatorio para clientes de crédito");
    if (!rfcValido(form.rfc, form.tipoPersona))
      return setError(
        form.tipoPersona === "moral"
          ? "RFC de persona moral inválido (12 caracteres, ej. ABC010101XY9)"
          : "RFC de persona física inválido (13 caracteres, ej. XAXX010101000)"
      );
    const limite = Number(form.limiteCredito);
    if (Number.isNaN(limite) || limite < 0)
      return setError("El límite de crédito debe ser un número mayor o igual a 0");

    const payload = {
      name: form.name,
      lastName: form.lastName,
      tipoPersona: form.tipoPersona,
      rfc: limpiarRFC(form.rfc),
      razonSocial: form.razonSocial,
      email: form.email,
      phone: form.phone,
      esMayoreo: true,
      limiteCredito: limite,
    };

    try {
      if (editId) {
        await axios.put(`/clients/${editId}`, payload);
        mostrarExito("Cliente de crédito actualizado");
      } else {
        await axios.post("/clients", payload);
        mostrarExito("Cliente de crédito registrado");
      }
      setShowForm(false);
      setForm(formInicial);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el cliente");
    }
  };

  // ── Cargos y abonos ─────────────────────────────────────────────
  const abrirMov = (cliente, tipo) => {
    setMovModal({ cliente, tipo });
    setMovForm({ amount: "", description: "" });
    setMovError("");
  };

  const submitMov = async (e) => {
    e.preventDefault();
    setMovError("");
    const amount = Number(movForm.amount);
    if (Number.isNaN(amount) || amount <= 0)
      return setMovError("El monto debe ser mayor a 0");

    const { cliente, tipo } = movModal;
    try {
      await axios.post(`/credits/${cliente._id}/${tipo}`, {
        amount,
        description: movForm.description,
      });
      mostrarExito(tipo === "cargo" ? "Cargo registrado" : "Abono registrado");
      setMovModal(null);
      cargar();
    } catch (err) {
      setMovError(err.response?.data?.message || "Error al registrar el movimiento");
    }
  };

  // ── Estado de cuenta ────────────────────────────────────────────
  const verEstadoCuenta = async (cliente) => {
    try {
      const res = await axios.get(`/credits/${cliente._id}/movimientos`);
      setEstadoCuenta(res.data);
    } catch {
      setError("Error al cargar el estado de cuenta");
    }
  };

  const inicial = (c) =>
    ((c.name || "?").charAt(0) + (c.lastName || "").charAt(0)).toUpperCase();

  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.rfc?.toLowerCase().includes(q) ||
      c.razonSocial?.toLowerCase().includes(q)
    );
  });

  // Barra de progreso del crédito usado
  const barra = (saldo, limite) => {
    const pct = limite > 0 ? Math.min(100, (saldo / limite) * 100) : (saldo > 0 ? 100 : 0);
    const color = pct >= 100 ? "#e74c3c" : pct >= 70 ? "#f9a825" : "#27ae60";
    return { pct, color };
  };

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Modal cargo / abono ─────────────────────────────────── */}
      {movModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ ...styles.modalIcon, background: movModal.tipo === "cargo" ? "#fff0f3" : "#f0fff4" }}>
              <i className={`fa ${movModal.tipo === "cargo" ? "fa-arrow-up" : "fa-arrow-down"}`}
                 style={{ color: movModal.tipo === "cargo" ? "#e05555" : "#27ae60", fontSize: 22 }} />
            </div>
            <h5 style={{ margin: "0 0 4px", color: "#1a1a2e", fontSize: 17 }}>
              {movModal.tipo === "cargo" ? "Registrar cargo (compra a crédito)" : "Registrar abono (pago)"}
            </h5>
            <p style={{ margin: "0 0 16px", color: "#888", fontSize: 13 }}>
              {movModal.cliente.name} {movModal.cliente.lastName || ""}
              {" · "}
              <strong>Saldo: {money(movModal.cliente.saldo)}</strong>
              {movModal.tipo === "cargo" && (
                <> · Disponible: <strong>{money(Math.max(0, (movModal.cliente.limiteCredito || 0) - (movModal.cliente.saldo || 0)))}</strong></>
              )}
            </p>
            <form onSubmit={submitMov} style={{ textAlign: "left" }}>
              <label style={styles.label}><i className="fa fa-dollar" style={styles.labelIcon} />Monto *</label>
              <input
                style={{ ...styles.input, marginBottom: 12 }}
                name="amount" type="number" min="0.01" step="0.01" autoFocus
                value={movForm.amount}
                onChange={(e) => setMovForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
              />
              <label style={styles.label}><i className="fa fa-comment" style={styles.labelIcon} />Concepto (opcional)</label>
              <input
                style={{ ...styles.input, marginBottom: 4 }}
                name="description"
                value={movForm.description}
                onChange={(e) => setMovForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={movModal.tipo === "cargo" ? "Ej: Pedido de mayoreo" : "Ej: Pago en efectivo"}
              />
              {movError && <div style={{ ...styles.alertError, marginTop: 10 }}><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{movError}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <button type="button" style={styles.btnModalCancel} onClick={() => setMovModal(null)}>Cancelar</button>
                <button type="submit" style={movModal.tipo === "cargo" ? styles.btnDangerSolid : styles.btnSuccessSolid}>
                  <i className="fa fa-check" style={{ marginRight: 7 }} />
                  {movModal.tipo === "cargo" ? "Registrar cargo" : "Registrar abono"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal estado de cuenta ──────────────────────────────── */}
      {estadoCuenta && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 520, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h5 style={{ margin: "0 0 2px", color: "#1a1a2e", fontSize: 17 }}>
                  Estado de cuenta
                </h5>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {estadoCuenta.client.name} {estadoCuenta.client.lastName || ""}
                  {estadoCuenta.client.rfc ? ` · ${estadoCuenta.client.rfc}` : ""}
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setEstadoCuenta(null)}>
                <i className="fa fa-times" />
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={styles.miniStat}><div style={styles.miniLabel}>Saldo</div><div style={{ ...styles.miniVal, color: "#e05555" }}>{money(estadoCuenta.client.saldo)}</div></div>
              <div style={styles.miniStat}><div style={styles.miniLabel}>Límite</div><div style={styles.miniVal}>{money(estadoCuenta.client.limiteCredito)}</div></div>
              <div style={styles.miniStat}><div style={styles.miniLabel}>Disponible</div><div style={{ ...styles.miniVal, color: "#27ae60" }}>{money(Math.max(0, (estadoCuenta.client.limiteCredito || 0) - (estadoCuenta.client.saldo || 0)))}</div></div>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {estadoCuenta.movimientos.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                  Sin movimientos todavía
                </div>
              ) : estadoCuenta.movimientos.map((m) => (
                <div key={m._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: "1px solid #f2f2f2" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: m.type === "cargo" ? "#fff0f3" : "#f0fff4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={`fa ${m.type === "cargo" ? "fa-arrow-up" : "fa-arrow-down"}`}
                       style={{ color: m.type === "cargo" ? "#e05555" : "#27ae60", fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
                      {m.description || (m.type === "cargo" ? "Cargo" : "Abono")}
                    </div>
                    <div style={{ fontSize: 11, color: "#9599b3" }}>
                      {new Date(m.createdAt).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: m.type === "cargo" ? "#e05555" : "#27ae60" }}>
                      {m.type === "cargo" ? "+" : "-"}{money(m.amount)}
                    </div>
                    <div style={{ fontSize: 10, color: "#9599b3" }}>Saldo: {money(m.saldoDespues)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, color: "#1a1a2e", fontSize: isMobile ? 16 : 18 }}>
            <i className="fa fa-credit-card" style={{ color: "#6372ff", marginRight: 10 }} />
            Créditos (mayoreo)
          </h4>
          <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 13 }}>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} con línea de crédito
          </p>
        </div>
        {showForm ? (
          <button style={styles.btnCancel} onClick={() => { setShowForm(false); setEditId(null); setForm(formInicial); }}>
            <i className="fa fa-times" style={{ marginRight: 8 }} />Cancelar
          </button>
        ) : (
          <button style={{ ...styles.btnPrimary, opacity: rfcGenerico ? 0.5 : 1, cursor: rfcGenerico ? "not-allowed" : "pointer" }}
            onClick={abrirNuevo} disabled={rfcGenerico}
            title={rfcGenerico ? "Configura el RFC de tu negocio primero" : ""}>
            <i className="fa fa-plus" style={{ marginRight: 8 }} />Nuevo cliente de crédito
          </button>
        )}
      </div>

      {rfcGenerico && (
        <div style={{ ...styles.alertError, justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />
            Tu negocio no tiene un RFC real configurado, así que no puedes dar crédito a clientes (sin RFC no puedes facturar).
          </span>
          <Link to="/dashboard/mi-negocio" style={{ color: "#c00", fontWeight: 700, textDecoration: "underline", whiteSpace: "nowrap" }}>
            Configurar RFC →
          </Link>
        </div>
      )}

      {error   && <div style={styles.alertError}><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{error}</div>}
      {success && <div style={styles.alertSuccess}><i className="fa fa-check-circle" style={{ marginRight: 8 }} />{success}</div>}

      {/* ── KPI cards ───────────────────────────────────────────── */}
      {resumen && (
        <div className="dash-kpi-grid" style={styles.kpiGrid}>
          {[
            { icon: "fa-money", bg: "#fff0f3", color: "#e05555", val: money(resumen.totalPorCobrar), label: "Total por cobrar" },
            { icon: "fa-users",            bg: "#f0f2ff", color: "#6372ff", val: resumen.clientesCredito, label: "Clientes con crédito" },
            { icon: "fa-check-circle",     bg: "#e8f5e9", color: "#27ae60", val: money(resumen.disponibleTotal), label: "Crédito disponible" },
            { icon: "fa-exclamation-triangle", bg: "#fff8e1", color: "#f9a825", val: resumen.sobreLimite, label: "Sobre su límite" },
          ].map(({ icon, bg, color, val, label }) => (
            <div key={label} style={styles.kpiCard}>
              <div style={{ ...styles.kpiIcon, background: bg }}>
                <i className={`fa ${icon}`} style={{ color, fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.1 }}>{val}</div>
                <div style={{ fontSize: 11, color: "#9599b3", marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Formulario alta/edición ─────────────────────────────── */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <i className={`fa ${editId ? "fa-pencil" : "fa-user-plus"}`} style={{ color: "#6372ff", fontSize: 18 }} />
            <h5 style={{ margin: 0, color: "#1a1a2e" }}>{editId ? "Editar cliente de crédito" : "Nuevo cliente de crédito"}</h5>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Tipo de persona */}
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}><i className="fa fa-id-card" style={styles.labelIcon} />Tipo de persona *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { v: "fisica", l: "Persona física", ico: "fa-user" },
                  { v: "moral",  l: "Persona moral",  ico: "fa-building" },
                ].map(({ v, l, ico }) => (
                  <button key={v} type="button"
                    onClick={() => setForm((p) => ({ ...p, tipoPersona: v }))}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      border: form.tipoPersona === v ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                      background: form.tipoPersona === v ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                      color: form.tipoPersona === v ? "#fff" : "#666",
                    }}>
                    <i className={`fa ${ico}`} style={{ fontSize: 12 }} />{l}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-form-grid" style={styles.formGrid}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-user" style={styles.labelIcon} />{form.tipoPersona === "moral" ? "Nombre comercial *" : "Nombre *"}</label>
                <input style={styles.input} name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Abarrotes La Esquina" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-user" style={styles.labelIcon} />{form.tipoPersona === "moral" ? "Contacto" : "Apellido"}</label>
                <input style={styles.input} name="lastName" value={form.lastName} onChange={handleChange} placeholder={form.tipoPersona === "moral" ? "Persona de contacto" : "Ej: Pérez"} />
              </div>

              {form.tipoPersona === "moral" && (
                <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                  <label style={styles.label}><i className="fa fa-building" style={styles.labelIcon} />Razón social</label>
                  <input style={styles.input} name="razonSocial" value={form.razonSocial} onChange={handleChange} placeholder="Ej: Distribuidora Ejemplo S.A. de C.V." />
                </div>
              )}

              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-id-card-o" style={styles.labelIcon} />RFC *</label>
                <input
                  style={{
                    ...styles.input,
                    textTransform: "uppercase",
                    borderColor: form.rfc && !rfcValido(form.rfc, form.tipoPersona) ? "#e05555" : "#e8e8e8",
                  }}
                  name="rfc" value={form.rfc}
                  onChange={(e) => setForm((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                  maxLength={13}
                  placeholder={form.tipoPersona === "moral" ? "12 caracteres" : "13 caracteres"}
                  required
                />
                {form.rfc && (
                  <span style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: rfcValido(form.rfc, form.tipoPersona) ? "#27ae60" : "#e05555" }}>
                    <i className={`fa ${rfcValido(form.rfc, form.tipoPersona) ? "fa-check-circle" : "fa-exclamation-circle"}`} style={{ marginRight: 5 }} />
                    {rfcValido(form.rfc, form.tipoPersona) ? "RFC válido" : "Formato de RFC inválido"}
                  </span>
                )}
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-credit-card" style={styles.labelIcon} />Límite de crédito *</label>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e8e8e8", borderRadius: 8, overflow: "hidden", background: "#fafafa" }}>
                  <span style={{ padding: "10px 12px", background: "#f0f2ff", color: "#6372ff", fontWeight: 700 }}>$</span>
                  <input
                    style={{ border: "none", outline: "none", padding: "10px 12px", fontSize: 14, fontWeight: 600, color: "#1a1a2e", background: "transparent", width: "100%" }}
                    name="limiteCredito" type="number" min="0" step="0.01"
                    value={form.limiteCredito} onChange={handleChange} placeholder="0.00" required
                  />
                </div>
              </div>

              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-envelope" style={styles.labelIcon} />Email</label>
                <input style={styles.input} name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-phone" style={styles.labelIcon} />Teléfono</label>
                <input style={styles.input} name="phone" value={form.phone} onChange={handleChange} placeholder="555-123-4567" />
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button type="submit" style={styles.btnSuccess}>
                <i className={`fa ${editId ? "fa-save" : "fa-check"}`} style={{ marginRight: 8 }} />
                {editId ? "Guardar cambios" : "Registrar cliente"}
              </button>
              <button type="button" style={styles.btnCancel} onClick={() => { setShowForm(false); setEditId(null); setForm(formInicial); }}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Buscador ────────────────────────────────────────────── */}
      {clientes.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ ...styles.searchBox, width: isMobile ? "100%" : 340 }}>
            <i className="fa fa-search" style={styles.searchIcon} />
            <input style={styles.searchInput} placeholder="Buscar por nombre, RFC o razón social..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={styles.searchClear}><i className="fa fa-times" /></button>
            )}
          </div>
          <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto" }}>
            {clientesFiltrados.length} de {clientes.length}
          </span>
        </div>
      )}

      {/* ── Lista de clientes de crédito ────────────────────────── */}
      {clientes.length === 0 ? (
        <div style={styles.empty}>
          <i className="fa fa-credit-card" style={{ fontSize: 40, color: "#d0d4ff", display: "block", marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: "#555", marginBottom: 4 }}>Aún no hay clientes de crédito</div>
          <div style={{ color: "#aaa", fontSize: 13 }}>Registra tu primer cliente de mayoreo con el botón de arriba</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {clientesFiltrados.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 13, background: "#fff", borderRadius: 12 }}>
              Sin resultados para <strong>"{busqueda}"</strong>
            </div>
          ) : clientesFiltrados.map((c) => {
            const disponible = Math.max(0, (c.limiteCredito || 0) - (c.saldo || 0));
            const b = barra(c.saldo || 0, c.limiteCredito || 0);
            const sobreLimite = (c.saldo || 0) > (c.limiteCredito || 0);
            return (
              <div key={c._id} style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(99,114,255,0.08)", border: sobreLimite ? "1.5px solid #ffd0d8" : "1.5px solid #f0f2ff", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Encabezado */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={styles.avatar}>{inicial(c)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.name} {c.lastName || ""}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#6372ff", background: "#f0f2ff", borderRadius: 6, padding: "2px 7px", textTransform: "uppercase" }}>
                        {c.tipoPersona === "moral" ? "Moral" : "Física"}
                      </span>
                      {c.rfc && <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{c.rfc}</span>}
                    </div>
                  </div>
                </div>

                {/* Cifras */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div><div style={styles.miniLabel}>Debe</div><div style={{ fontSize: 16, fontWeight: 800, color: sobreLimite ? "#e74c3c" : "#e05555" }}>{money(c.saldo)}</div></div>
                  <div style={{ textAlign: "center" }}><div style={styles.miniLabel}>Límite</div><div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>{money(c.limiteCredito)}</div></div>
                  <div style={{ textAlign: "right" }}><div style={styles.miniLabel}>Disponible</div><div style={{ fontSize: 16, fontWeight: 800, color: "#27ae60" }}>{money(disponible)}</div></div>
                </div>

                {/* Barra progreso */}
                <div>
                  <div style={{ height: 8, background: "#f0f0f0", borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ width: `${b.pct}%`, height: "100%", background: b.color, borderRadius: 20, transition: "width 0.3s" }} />
                  </div>
                  {sobreLimite && (
                    <div style={{ fontSize: 11, color: "#e74c3c", fontWeight: 700, marginTop: 4 }}>
                      <i className="fa fa-exclamation-triangle" style={{ marginRight: 5 }} />Excede su límite de crédito
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button style={styles.btnCargo} onClick={() => abrirMov(c, "cargo")}>
                    <i className="fa fa-arrow-up" style={{ marginRight: 5 }} />Cargo
                  </button>
                  <button style={styles.btnAbono} onClick={() => abrirMov(c, "abono")} disabled={(c.saldo || 0) <= 0}
                    title={(c.saldo || 0) <= 0 ? "Sin saldo pendiente" : ""}>
                    <i className="fa fa-arrow-down" style={{ marginRight: 5 }} />Abono
                  </button>
                  <button style={styles.btnGhost} onClick={() => verEstadoCuenta(c)}>
                    <i className="fa fa-list" style={{ marginRight: 5 }} />Estado
                  </button>
                  <button style={styles.btnGhost} onClick={() => abrirEditar(c)}>
                    <i className="fa fa-pencil" style={{ marginRight: 5 }} />Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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
  btnCargo: {
    flex: 1, minWidth: 80, background: "#fff0f3", color: "#e05555", border: "1px solid #ffd0d8",
    borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
  btnAbono: {
    flex: 1, minWidth: 80, background: "#f0fff4", color: "#1a7c40", border: "1px solid #b7f0cc",
    borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
  btnGhost: {
    flex: 1, minWidth: 80, background: "#f4f6ff", color: "#6372ff", border: "1px solid #c8ccff",
    borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
  btnSuccessSolid: {
    background: "linear-gradient(135deg,#27ae60,#2ecc71)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  btnDangerSolid: {
    background: "linear-gradient(135deg,#e05555,#ff7675)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  btnModalCancel: {
    background: "#f4f6f9", color: "#666", border: "1px solid #e0e0e0",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
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
  searchBox: { position: "relative", width: 340 },
  searchIcon: {
    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
    color: "#6372ff", fontSize: 14, pointerEvents: "none",
  },
  searchInput: {
    width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10,
    border: "1.5px solid #d0d4ff", fontSize: 14, outline: "none",
    boxSizing: "border-box", background: "#fff", color: "#1a1a2e", fontWeight: 600,
  },
  searchClear: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, padding: "2px 4px",
  },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  kpiCard: {
    background: "#fff", borderRadius: 12, padding: "14px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12,
  },
  kpiIcon: {
    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  avatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "linear-gradient(135deg, #6372ff, #5ca9fb)",
    color: "#fff", fontWeight: 700, fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  miniLabel: { fontSize: 10, color: "#9599b3", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 },
  miniVal: { fontSize: 16, fontWeight: 800, color: "#1a1a2e" },
  miniStat: {
    flex: 1, minWidth: 90, background: "#f8f9ff", border: "1.5px solid #eef0ff",
    borderRadius: 10, padding: "8px 12px",
  },
  empty: {
    background: "#fff", borderRadius: 12, padding: "50px 30px",
    textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  alertError:   { background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8, border: "1px solid #ffd0d8", display: "flex", alignItems: "center", fontSize: 13 },
  alertSuccess: { background: "#f0fff4", color: "#1a7c40", padding: "10px 16px", borderRadius: 8, border: "1px solid #b7f0cc", display: "flex", alignItems: "center", fontSize: 13 },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 999,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 16, padding: "28px 26px", maxWidth: 400, width: "100%",
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)", textAlign: "center",
  },
  modalIcon: {
    width: 56, height: 56, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  closeBtn: {
    background: "#f4f6f9", color: "#888", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer", fontSize: 14, flexShrink: 0,
  },
};

export default Creditos;
