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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <h4 style={{ margin: 0, color: "#1a1a2e" }}>
          <i className="fa fa-building" style={{ color: "#6372ff", marginRight: 10 }} />
          Mi Negocio
        </h4>
        <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 13 }}>
          Datos de tu negocio y perfil de propietario
        </p>
      </div>

      {error   && <div style={styles.alertError}><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{error}</div>}
      {success && <div style={styles.alertSuccess}><i className="fa fa-check-circle" style={{ marginRight: 8 }} />{success}</div>}

      {/* Tarjeta negocio */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6372ff,#5ca9fb)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa fa-store" style={{ color: "#fff", fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>Información del negocio</div>
              <div style={{ fontSize: 12, color: "#9599b3" }}>{business?.category || "Sin categoría"}</div>
            </div>
          </div>
          {editMode !== "negocio" && (
            <button style={styles.btnEdit} onClick={() => { setEditMode("negocio"); setSuccess(""); setError(""); }}>
              <i className="fa fa-pencil" style={{ marginRight: 7 }} />Editar
            </button>
          )}
        </div>

        {editMode === "negocio" ? (
          <form onSubmit={handleSaveNegocio}>
            <div style={styles.formGrid}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-tag" style={styles.labelIcon} />Nombre del negocio *</label>
                <input style={styles.input} value={formNegocio.name}
                  onChange={(e) => setFormNegocio({ ...formNegocio, name: e.target.value })} required placeholder="Tienda El Sol" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-list" style={styles.labelIcon} />Categoría</label>
                <input style={styles.input} placeholder="Abarrotes, Ropa, Electrónica..."
                  value={formNegocio.category}
                  onChange={(e) => setFormNegocio({ ...formNegocio, category: e.target.value })} />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-map-marker" style={styles.labelIcon} />Dirección</label>
                <input style={styles.input} placeholder="Calle 5 de Mayo #10, Col. Centro"
                  value={formNegocio.address}
                  onChange={(e) => setFormNegocio({ ...formNegocio, address: e.target.value })} />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-phone" style={styles.labelIcon} />Teléfono</label>
                <input style={styles.input} placeholder="555-123-4567"
                  value={formNegocio.phone}
                  onChange={(e) => setFormNegocio({ ...formNegocio, phone: e.target.value })} />
              </div>
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}><i className="fa fa-align-left" style={styles.labelIcon} />Descripción</label>
                <textarea style={{ ...styles.input, resize: "vertical", minHeight: 70 }} rows={3}
                  placeholder="¿A qué se dedica tu negocio?"
                  value={formNegocio.description}
                  onChange={(e) => setFormNegocio({ ...formNegocio, description: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button type="submit" style={styles.btnSave}>
                <i className="fa fa-save" style={{ marginRight: 8 }} />Guardar cambios
              </button>
              <button type="button" style={styles.btnCancel} onClick={() => setEditMode(null)}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div style={styles.infoGrid}>
            <InfoRow icon="fa-tag"         label="Nombre"      value={business?.name} />
            <InfoRow icon="fa-list"         label="Categoría"   value={business?.category} />
            <InfoRow icon="fa-map-marker"   label="Dirección"   value={business?.address} />
            <InfoRow icon="fa-phone"        label="Teléfono"    value={business?.phone} />
            <InfoRow icon="fa-align-left"   label="Descripción" value={business?.description} span />
            <InfoRow icon="fa-link"         label="Slug"        value={business?.slug} note="Identificador único generado al registrar" />
          </div>
        )}
      </div>

      {/* Tarjeta usuario */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#27ae60,#81c784)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa fa-user" style={{ color: "#fff", fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>Datos del propietario</div>
              <div style={{ fontSize: 12, color: "#9599b3" }}>{user?.email}</div>
            </div>
          </div>
          {editMode !== "usuario" && (
            <button style={styles.btnEdit} onClick={() => { setEditMode("usuario"); setSuccess(""); setError(""); }}>
              <i className="fa fa-pencil" style={{ marginRight: 7 }} />Editar
            </button>
          )}
        </div>

        {editMode === "usuario" ? (
          <form onSubmit={handleSaveUsuario}>
            <div style={styles.formGrid}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-user" style={styles.labelIcon} />Nombre *</label>
                <input style={styles.input} value={formUsuario.name}
                  onChange={(e) => setFormUsuario({ ...formUsuario, name: e.target.value })} required placeholder="Juan" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-user" style={styles.labelIcon} />Apellido *</label>
                <input style={styles.input} value={formUsuario.lastName}
                  onChange={(e) => setFormUsuario({ ...formUsuario, lastName: e.target.value })} required placeholder="López García" />
              </div>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button type="submit" style={styles.btnSave}>
                <i className="fa fa-save" style={{ marginRight: 8 }} />Guardar cambios
              </button>
              <button type="button" style={styles.btnCancel} onClick={() => setEditMode(null)}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div style={styles.infoGrid}>
            <InfoRow icon="fa-user"    label="Nombre"   value={user?.name} />
            <InfoRow icon="fa-user"    label="Apellido" value={user?.lastName} />
            <InfoRow icon="fa-envelope" label="Email"   value={user?.email} note="El email no se puede cambiar" />
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, note, span }) => (
  <div style={{ gridColumn: span ? "1 / -1" : "auto", display: "flex", flexDirection: "column", gap: 3 }}>
    <div style={{ fontSize: 11, color: "#9599b3", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
      display: "flex", alignItems: "center", gap: 5 }}>
      {icon && <i className={`fa ${icon}`} style={{ color: "#6372ff", fontSize: 11 }} />}
      {label}
    </div>
    <div style={{ fontWeight: value ? 600 : 400, color: value ? "#1a1a2e" : "#ccc", fontSize: 14 }}>
      {value || "Sin información"}
    </div>
    {note && <div style={{ fontSize: 11, color: "#aaa" }}>{note}</div>}
  </div>
);

const styles = {
  card: {
    background: "#fff", borderRadius: 14, padding: "22px 24px",
    boxShadow: "0 2px 12px rgba(99,114,255,0.08)", border: "1px solid #eef0ff",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22,
    paddingBottom: 16, borderBottom: "1px solid #f4f4f8" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 40px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  fieldWrap: { display: "flex", flexDirection: "column" },
  label: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#888", marginBottom: 6,
    fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  labelIcon: { color: "#6372ff", fontSize: 12 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8",
    fontSize: 14, color: "#1a1a2e", fontWeight: 600, outline: "none",
    boxSizing: "border-box", background: "#fafafa" },
  btnEdit: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none",
    borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13,
    display: "inline-flex", alignItems: "center",
  },
  btnSave: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  btnCancel: {
    background: "#fff", color: "#e05555", border: "1.5px solid #ffd0d8",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  alertError:   { background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8, border: "1px solid #ffd0d8", display: "flex", alignItems: "center" },
  alertSuccess: { background: "#f0f4ff", color: "#4050cc", padding: "10px 16px", borderRadius: 8, border: "1px solid #c8ccff", display: "flex", alignItems: "center" },
  alertSuccess: { background: "#f0f4ff", color: "#4050cc", padding: "10px 16px", borderRadius: 8, marginBottom: 16, border: "1px solid #c8ccff" },
};

export default MiNegocio;
