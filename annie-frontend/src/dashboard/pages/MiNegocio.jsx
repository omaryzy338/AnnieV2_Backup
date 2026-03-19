import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";

const MiNegocio = () => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(null); // "negocio" | "usuario" | null
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const [formNegocio, setFormNegocio] = useState({ name: "", address: "", phone: "", category: "", description: "" });
  const [formUsuario, setFormUsuario] = useState({ name: "", lastName: "" });

  const cargar = async () => {
    try {
      const res = await axios.get("/profile");
      setData(res.data);
      const { user, business } = res.data;
      setFormNegocio({
        name: business?.name || "",
        address: business?.address || "",
        phone: business?.phone || "",
        category: business?.category || "",
        description: business?.description || "",
      });
      setFormUsuario({ name: user.name, lastName: user.lastName });
    } catch { setError("Error al cargar el perfil"); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleSaveNegocio = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await axios.put("/profile/business", formNegocio);
      // Actualizar localStorage con el nuevo nombre
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.setItem("businessName", formNegocio.name);
      }
      setSuccess("Datos del negocio actualizados");
      setEditMode(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar");
    }
  };

  const handleSaveUsuario = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await axios.put("/profile/user", formUsuario);
      setSuccess("Datos del usuario actualizados");
      setEditMode(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar");
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  const { user, business } = data || {};

  return (
    <div>
      <h4 style={{ marginBottom: 24 }}>Mi Negocio</h4>

      {error   && <div style={styles.alertError}>{error}</div>}
      {success && <div style={styles.alertSuccess}>{success}</div>}

      {/* Tarjeta negocio */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <span style={styles.icon}>🏪</span>
            <strong>Información del negocio</strong>
          </div>
          {editMode !== "negocio" && (
            <button className="btn btn-primary btn-sm" style={{ background: "linear-gradient(to right, #6372ff, #5ca9fb)", border: "none" }} onClick={() => { setEditMode("negocio"); setSuccess(""); setError(""); }}>
              Editar
            </button>
          )}
        </div>

        {editMode === "negocio" ? (
          <form onSubmit={handleSaveNegocio}>
            <div style={styles.formGrid}>
              <div>
                <label>Nombre del negocio *</label>
                <input className="form-control" value={formNegocio.name}
                  onChange={(e) => setFormNegocio({ ...formNegocio, name: e.target.value })} required />
              </div>
              <div>
                <label>Categoría</label>
                <input className="form-control" placeholder="Abarrotes, Ropa, Electrónica..."
                  value={formNegocio.category}
                  onChange={(e) => setFormNegocio({ ...formNegocio, category: e.target.value })} />
              </div>
              <div>
                <label>Dirección</label>
                <input className="form-control" placeholder="Calle 5 de Mayo #10, Col. Centro"
                  value={formNegocio.address}
                  onChange={(e) => setFormNegocio({ ...formNegocio, address: e.target.value })} />
              </div>
              <div>
                <label>Teléfono</label>
                <input className="form-control" placeholder="555-123-4567"
                  value={formNegocio.phone}
                  onChange={(e) => setFormNegocio({ ...formNegocio, phone: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Descripción</label>
                <textarea className="form-control" rows={3} placeholder="¿A qué se dedica tu negocio?"
                  value={formNegocio.description}
                  onChange={(e) => setFormNegocio({ ...formNegocio, description: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-success btn-sm">Guardar cambios</button>
              <button type="button" className="btn btn-default btn-sm" onClick={() => setEditMode(null)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div style={styles.infoGrid}>
            <InfoRow label="Nombre"      value={business?.name} />
            <InfoRow label="Categoría"   value={business?.category} />
            <InfoRow label="Dirección"   value={business?.address} />
            <InfoRow label="Teléfono"    value={business?.phone} />
            <InfoRow label="Descripción" value={business?.description} span />
            <InfoRow label="Slug"        value={business?.slug} note="Identificador único generado al registrar" />
          </div>
        )}
      </div>

      {/* Tarjeta usuario */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <span style={styles.icon}>👤</span>
            <strong>Datos del propietario</strong>
          </div>
          {editMode !== "usuario" && (
            <button className="btn btn-primary btn-sm" style={{ background: "linear-gradient(to right, #6372ff, #5ca9fb)", border: "none" }} onClick={() => { setEditMode("usuario"); setSuccess(""); setError(""); }}>
              Editar
            </button>
          )}
        </div>

        {editMode === "usuario" ? (
          <form onSubmit={handleSaveUsuario}>
            <div style={styles.formGrid}>
              <div>
                <label>Nombre *</label>
                <input className="form-control" value={formUsuario.name}
                  onChange={(e) => setFormUsuario({ ...formUsuario, name: e.target.value })} required />
              </div>
              <div>
                <label>Apellido *</label>
                <input className="form-control" value={formUsuario.lastName}
                  onChange={(e) => setFormUsuario({ ...formUsuario, lastName: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-success btn-sm">Guardar cambios</button>
              <button type="button" className="btn btn-default btn-sm" onClick={() => setEditMode(null)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div style={styles.infoGrid}>
            <InfoRow label="Nombre"   value={user?.name} />
            <InfoRow label="Apellido" value={user?.lastName} />
            <InfoRow label="Email"    value={user?.email} note="El email no se puede cambiar" />
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, note, span }) => (
  <div style={{ gridColumn: span ? "1 / -1" : "auto" }}>
    <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{label}</div>
    <div style={{ fontWeight: value ? 500 : 400, color: value ? "#222" : "#bbb" }}>
      {value || "Sin información"}
    </div>
    {note && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{note}</div>}
  </div>
);

const styles = {
  card: { background: "#fff", borderRadius: 10, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "4px solid transparent" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  icon: { marginRight: 10, fontSize: 20 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 32px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  alertError:   { background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8, marginBottom: 16, border: "1px solid #ffd0d8" },
  alertSuccess: { background: "#f0f4ff", color: "#4050cc", padding: "10px 16px", borderRadius: 8, marginBottom: 16, border: "1px solid #c8ccff" },
};

export default MiNegocio;
