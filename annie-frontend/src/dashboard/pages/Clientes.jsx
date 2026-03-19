import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";

const camposIniciales = { name: "", lastName: "", email: "", phone: "" };

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(camposIniciales);
  const [editId, setEditId]     = useState(null);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cargar = async () => {
    try {
      const res = await axios.get("/clients");
      setClientes(res.data);
    } catch { setError("Error al cargar clientes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

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
        setSuccess("Cliente actualizado correctamente");
      } else {
        await axios.post("/clients", form);
        setSuccess("Cliente registrado correctamente");
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
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try {
      await axios.delete(`/clients/${id}`);
      setSuccess("Cliente eliminado");
      cargar();
    } catch { setError("Error al eliminar"); }
  };

  const handleNuevo = () => {
    setForm(camposIniciales);
    setEditId(null);
    setShowForm(!showForm);
    setError(""); setSuccess("");
  };

  // Filtro de búsqueda
  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  const inicial = (c) =>
    ((c.name || "?").charAt(0) + (c.lastName || "").charAt(0)).toUpperCase();

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h4 style={{ margin: 0 }}>Clientes</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#aaa" }}>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button style={styles.btnPrimary} onClick={handleNuevo}>
          {showForm ? "✕ Cancelar" : "+ Nuevo cliente"}
        </button>
      </div>

      {error   && <div style={styles.alertError}>{error}</div>}
      {success && <div style={styles.alertSuccess}>{success}</div>}

      {/* Formulario */}
      {showForm && (
        <div style={styles.formCard}>
          <h5 style={{ marginBottom: 16, color: "#1a1a2e" }}>
            {editId ? "✏️ Editar cliente" : "👤 Nuevo cliente"}
          </h5>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Nombre *</label>
                <input style={styles.input} name="name" value={form.name}
                  onChange={handleChange} required placeholder="María" />
              </div>
              <div>
                <label style={styles.label}>Apellido</label>
                <input style={styles.input} name="lastName" value={form.lastName}
                  onChange={handleChange} placeholder="Pérez" />
              </div>
              <div>
                <label style={styles.label}>Email</label>
                <input style={styles.input} name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="cliente@correo.com" />
              </div>
              <div>
                <label style={styles.label}>Teléfono</label>
                <input style={styles.input} name="phone" value={form.phone}
                  onChange={handleChange} placeholder="555-123-4567" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button type="submit" style={styles.btnSuccess}>
                {editId ? "Guardar cambios" : "Registrar cliente"}
              </button>
              <button type="button" style={styles.btnCancel} onClick={handleNuevo}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Búsqueda */}
      {clientes.length > 0 && (
        <div style={styles.searchWrapper}>
          <i className="fa fa-search" style={styles.searchIcon} />
          <input
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {/* Tabla / Lista */}
      {clientes.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 600, color: "#555" }}>Aún no tienes clientes</div>
          <div style={{ color: "#aaa", marginTop: 4 }}>Agrega tu primer cliente para llevar el historial</div>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ color: "#aaa" }}>No se encontraron resultados para "<strong>{busqueda}</strong>"</div>
        </div>
      ) : (
        <div style={styles.grid}>
          {clientesFiltrados.map((c) => (
            <div key={c._id} style={styles.clientCard}>
              {/* Avatar */}
              <div style={styles.avatar}>{inicial(c)}</div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>
                  {c.name} {c.lastName || ""}
                </div>
                {c.email && (
                  <div style={styles.infoLine}>
                    <i className="fa fa-envelope" /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div style={styles.infoLine}>
                    <i className="fa fa-phone" /> {c.phone}
                  </div>
                )}
                {!c.email && !c.phone && (
                  <div style={{ color: "#ccc", fontSize: 12 }}>Sin datos de contacto</div>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button style={styles.btnEdit} onClick={() => handleEditar(c)}>Editar</button>
                <button style={styles.btnDelete} onClick={() => handleEliminar(c._id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  btnPrimary: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnSuccess: {
    background: "#6372ff", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnCancel: {
    background: "#f4f6f9", color: "#555", border: "1px solid #ddd", borderRadius: 8,
    padding: "10px 20px", cursor: "pointer", fontSize: 14,
  },
  btnEdit: {
    background: "#f4f6ff", color: "#6372ff", border: "1px solid #c8ccff",
    borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  btnDelete: {
    background: "#fff0f3", color: "#e05555", border: "1px solid #ffd0d8",
    borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  formCard: {
    background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.09)", borderLeft: "4px solid #6372ff",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  label: { display: "block", fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8",
    fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa",
  },
  searchWrapper: {
    position: "relative",
    maxWidth: 340,
    marginBottom: 20,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6372ff",
    fontSize: 14,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px 10px 40px",
    borderRadius: 10,
    border: "1.5px solid #d0d4ff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#f6f7ff",
    color: "#333",
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16,
  },
  clientCard: {
    background: "#fff", borderRadius: 12, padding: "18px 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    display: "flex", alignItems: "center", gap: 16,
    transition: "box-shadow 0.2s",
  },
  avatar: {
    width: 46, height: 46, borderRadius: "50%",
    background: "linear-gradient(135deg, #6372ff, #5ca9fb)",
    color: "#fff", fontWeight: 700, fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoLine: {
    fontSize: 13, color: "#888", marginTop: 3, display: "flex", alignItems: "center", gap: 6,
  },
  empty: {
    background: "#fff", borderRadius: 12, padding: 60, textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  alertError:   { background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8, marginBottom: 16, border: "1px solid #ffd0d8" },
  alertSuccess: { background: "#f0f4ff", color: "#4050cc", padding: "10px 16px", borderRadius: 8, marginBottom: 16, border: "1px solid #c8ccff" },
};

export default Clientes;
