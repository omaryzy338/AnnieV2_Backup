import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";
import useWindowWidth from "../../hooks/useWindowWidth";

const camposIniciales = { name: "", lastName: "", email: "", phone: "" };

const Clientes = () => {
  const [clientes, setClientes]       = useState([]);
  const [ventas,   setVentas]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(camposIniciales);
  const [editId, setEditId]           = useState(null);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [busqueda, setBusqueda]       = useState("");
  const [confirmId, setConfirmId]     = useState(null);
  const [hoveredRow, setHoveredRow]   = useState(null);
  const w = useWindowWidth();
  const isMobile = w < 768;

  const cargar = async () => {
    try {
      const [rc, rv] = await Promise.all([axios.get("/clients"), axios.get("/sales")]);
      setClientes(rc.data);
      setVentas(rv.data);
    } catch { setError("Error al cargar clientes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      if (editId) {
        await axios.put(`/clients/${editId}`, form);
        mostrarExito("Cliente actualizado correctamente");
      } else {
        await axios.post("/clients", form);
        mostrarExito("Cliente registrado correctamente");
      }
      setForm(camposIniciales);
      setShowForm(false);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar cliente");
    }
  };

  const handleEditar = (c) => {
    setForm({ name: c.name, lastName: c.lastName || "", email: c.email || "", phone: c.phone || "" });
    setEditId(c._id);
    setShowForm(true);
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    try {
      await axios.delete(`/clients/${id}`);
      mostrarExito("Cliente eliminado");
      cargar();
    } catch { setError("Error al eliminar"); }
    finally { setConfirmId(null); }
  };

  const inicial = (c) =>
    ((c.name || "?").charAt(0) + (c.lastName || "").charAt(0)).toUpperCase();

  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  // KPIs
  const conEmail  = clientes.filter((c) => c.email).length;
  const conPhone  = clientes.filter((c) => c.phone).length;
  const completos = clientes.filter((c) => c.email && c.phone).length;

  // Stats por cliente (compras + total + última compra)
  const statsCliente = (clienteId) => {
    const vs = ventas.filter((v) => v.client && (v.client._id || v.client) === clienteId);
    const total = vs.reduce((a, v) => a + v.total, 0);
    const ultima = vs.length > 0
      ? vs.reduce((a, v) => new Date(v.saleDate || v.createdAt) > new Date(a.saleDate || a.createdAt) ? v : a)
      : null;
    return { compras: vs.length, total, ultima };
  };

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Modal confirmar eliminar */}
      {confirmId && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <i className="fa fa-user-times" style={{ color: "#e05555", fontSize: 24 }} />
            </div>
            <h5 style={{ margin: "0 0 6px", color: "#1a1a2e", fontSize: 16 }}>Eliminar cliente?</h5>
            <p style={{ margin: "0 0 20px", color: "#888", fontSize: 13 }}>
              Esta accion no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={styles.btnModalCancel} onClick={() => setConfirmId(null)}>
                Cancelar
              </button>
              <button style={styles.btnModalDelete} onClick={() => handleEliminar(confirmId)}>
                <i className="fa fa-trash" style={{ marginRight: 7 }} />Si, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, color: "#1a1a2e", fontSize: isMobile ? 16 : 18 }}>
            <i className="fa fa-users" style={{ color: "#6372ff", marginRight: 10 }} />
            Clientes
          </h4>
          <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 13 }}>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        {showForm ? (
          <button style={styles.btnCancel} onClick={() => { setShowForm(false); setEditId(null); setForm(camposIniciales); }}>
            <i className="fa fa-times" style={{ marginRight: 8 }} />Cancelar
          </button>
        ) : (
          <button style={styles.btnPrimary} onClick={() => { setShowForm(true); setEditId(null); setForm(camposIniciales); }}>
            <i className="fa fa-plus" style={{ marginRight: 8 }} />Nuevo cliente
          </button>
        )}
      </div>

      {error   && <div style={styles.alertError}><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{error}</div>}
      {success && <div style={styles.alertSuccess}><i className="fa fa-check-circle" style={{ marginRight: 8 }} />{success}</div>}

      {/* KPI cards */}
      {clientes.length > 0 && (
        <div className="dash-kpi-grid" style={styles.kpiGrid}>
          {[
            { icon: "fa-users",        bg: "#f0f2ff", color: "#6372ff", val: clientes.length, label: "Total clientes"    },
            { icon: "fa-envelope",     bg: "#e8f5e9", color: "#27ae60", val: conEmail,         label: "Con email"         },
            { icon: "fa-phone",        bg: "#fff8e1", color: "#f9a825", val: conPhone,         label: "Con telefono"      },
            { icon: "fa-check-circle", bg: "#e3f2fd", color: "#1976d2", val: completos,        label: "Contacto completo" },
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

      {/* Formulario */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <i className={`fa ${editId ? "fa-pencil" : "fa-user-plus"}`} style={{ color: "#6372ff", fontSize: 18 }} />
            <h5 style={{ margin: 0, color: "#1a1a2e" }}>{editId ? "Editar cliente" : "Nuevo cliente"}</h5>
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
                  <i className="fa fa-user" style={styles.labelIcon} />Apellido
                </label>
                <input style={styles.input} name="lastName" value={form.lastName}
                  onChange={handleChange} placeholder="Ej: Pérez" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-envelope" style={styles.labelIcon} />Email
                </label>
                <input style={styles.input} name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="Ej: maria@correo.com" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-phone" style={styles.labelIcon} />Telefono
                </label>
                <input style={styles.input} name="phone" value={form.phone}
                  onChange={handleChange} placeholder="Ej: 555-123-4567" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button type="submit" style={styles.btnSuccess}>
                <i className={`fa ${editId ? "fa-save" : "fa-check"}`} style={{ marginRight: 8 }} />
                {editId ? "Guardar cambios" : "Registrar cliente"}
              </button>
              <button type="button" style={styles.btnCancel}
                onClick={() => { setShowForm(false); setEditId(null); setForm(camposIniciales); }}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Busqueda + contador */}
      {clientes.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ ...styles.searchBox, width: isMobile ? "100%" : 340 }}>
            <i className="fa fa-search" style={styles.searchIcon} />
            <input
              style={styles.searchInput}
              placeholder="Buscar por nombre, email o telefono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={styles.searchClear}>
                <i className="fa fa-times" />
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto" }}>
            {clientesFiltrados.length} de {clientes.length} clientes
          </span>
        </div>
      )}

      {/* Tabla / Empty state */}
      {clientes.length === 0 ? (
        <div style={styles.empty}>
          <i className="fa fa-users" style={{ fontSize: 40, color: "#d0d4ff", display: "block", marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: "#555", marginBottom: 4 }}>Aun no tienes clientes</div>
          <div style={{ color: "#aaa", fontSize: 13 }}>Agrega tu primer cliente con el boton de arriba</div>
        </div>
      ) : isMobile ? (
        /* Vista cards en móvil */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {clientesFiltrados.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 13, background: "#fff", borderRadius: 12 }}>
              Sin resultados para <strong>"{busqueda}"</strong>
            </div>
          ) : clientesFiltrados.map((c) => {
            const st = statsCliente(c._id);
            return (
              <div key={c._id} style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={styles.avatar}>{inicial(c)}</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: "#1a1a2e", fontSize: 14 }}>{c.name} {c.lastName || ""}</strong>
                    {c.email && (
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        <i className="fa fa-envelope" style={{ color: "#6372ff", fontSize: 10, marginRight: 5 }} />{c.email}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {c.phone && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, background: "#f0f2ff", borderRadius: 20, padding: "3px 10px", fontWeight: 600, color: "#6372ff" }}>
                      <i className="fa fa-phone" style={{ fontSize: 10 }} />{c.phone}
                    </span>
                  )}
                  {st.compras > 0 ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6372ff" }}>${st.total.toFixed(2)} · {st.compras} compra{st.compras !== 1 ? "s" : ""}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: "#ccc" }}>Sin compras</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...styles.btnEdit, flex: 1, justifyContent: "center" }} onClick={() => handleEditar(c)}>
                    <i className="fa fa-pencil" style={{ marginRight: 5 }} />Editar
                  </button>
                  <button style={{ ...styles.btnDelete, flex: 1, justifyContent: "center" }} onClick={() => setConfirmId(c._id)}>
                    <i className="fa fa-trash" style={{ marginRight: 5 }} />Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dash-table-wrap" style={styles.tableCard}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Total gastado</th>
                <th style={styles.th}>Última compra</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                    Sin resultados para <strong>"{busqueda}"</strong>
                  </td>
                </tr>
              ) : clientesFiltrados.map((c) => (
                <tr key={c._id}
                  onMouseEnter={() => setHoveredRow(c._id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: hoveredRow === c._id ? "#f8f9ff" : "transparent",
                    transition: "background 0.12s",
                  }}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={styles.avatar}>{inicial(c)}</div>
                      <div>
                        <strong style={{ color: "#1a1a2e", fontSize: 14 }}>
                          {c.name} {c.lastName || ""}
                        </strong>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {c.email ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#555", fontSize: 13 }}>
                        <i className="fa fa-envelope" style={{ color: "#6372ff", fontSize: 12 }} />
                        {c.email}
                      </span>
                    ) : <span style={{ color: "#ccc", fontSize: 12 }}>--</span>}
                  </td>
                  <td style={styles.td}>
                    {c.phone ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
                        background: "#f0f2ff", borderRadius: 20, padding: "3px 10px",
                        fontWeight: 600, color: "#6372ff",
                      }}>
                        <i className="fa fa-phone" style={{ fontSize: 11 }} />
                        {c.phone}
                      </span>
                    ) : <span style={{ color: "#ccc", fontSize: 12 }}>--</span>}
                  </td>
                  {(() => {
                    const st = statsCliente(c._id);
                    return (
                      <>
                        <td style={styles.td}>
                          {st.compras > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              <span style={{ fontWeight: 700, color: "#6372ff", fontSize: 13 }}>${st.total.toFixed(2)}</span>
                              <span style={{ fontSize: 11, color: "#9599b3" }}>{st.compras} compra{st.compras !== 1 ? "s" : ""}</span>
                            </div>
                          ) : <span style={{ color: "#ccc", fontSize: 12 }}>Sin compras</span>}
                        </td>
                        <td style={styles.td}>
                          {st.ultima ? (
                            <span style={{ fontSize: 12, color: "#9599b3" }}>
                              {new Date(st.ultima.saleDate || st.ultima.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          ) : <span style={{ color: "#ccc", fontSize: 12 }}>--</span>}
                        </td>
                      </>
                    );
                  })()}
                  <td style={styles.td}>
                    <button style={styles.btnEdit} onClick={() => handleEditar(c)}>
                      <i className="fa fa-pencil" style={{ marginRight: 5 }} />Editar
                    </button>
                    <button style={styles.btnDelete} onClick={() => setConfirmId(c._id)}>
                      <i className="fa fa-trash" style={{ marginRight: 5 }} />Eliminar
                    </button>
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
  btnEdit: {
    background: "#f4f6ff", color: "#6372ff", border: "1px solid #c8ccff",
    borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, marginRight: 6, display: "inline-flex", alignItems: "center",
  },
  btnDelete: {
    background: "#fff0f3", color: "#e05555", border: "1px solid #ffd0d8",
    borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, display: "inline-flex", alignItems: "center",
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
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)", textAlign: "center",
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

export default Clientes;