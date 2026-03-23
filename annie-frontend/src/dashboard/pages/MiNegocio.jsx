import React, { useEffect, useState, useRef } from "react";
import axios from "../../api/axiosConfig";
import useWindowWidth from "../../hooks/useWindowWidth";

const estadosMexico = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de Mexico","Coahuila","Colima","Durango","Estado de Mexico","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacan","Morelos","Nayarit","Nuevo Leon","Oaxaca","Puebla","Queretaro","Quintana Roo","San Luis Potosi","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatan","Zacatecas"
];
const defaultCountry = "Mexico";

const MiNegocio = () => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(null);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const logoRef = useRef(null);
  const w = useWindowWidth();
  const isMobile = w < 768;

  const [formNegocio, setFormNegocio] = useState({
    name: "", address: "", phone: "", category: "", description: "",
    country: defaultCountry, state: "", city: "",
  });
  const [formUsuario, setFormUsuario] = useState({
    name: "", lastName: "", birthDate: "",
    country: defaultCountry, state: "", city: "",
  });

  const cargar = async () => {
    try {
      const res = await axios.get("/profile");
      setData(res.data);
      setLogoBroken(false);
      const { user, business } = res.data;
      setFormNegocio({
        name: business?.name || "",
        address: business?.address || "",
        phone: business?.phone || "",
        category: business?.category || "",
        description: business?.description || "",
        country: business?.country || defaultCountry,
        state: business?.state || "",
        city: business?.city || "",
      });
      setFormUsuario({
        name: user.name,
        lastName: user.lastName,
        birthDate: user.birthDate ? user.birthDate.substring(0, 10) : "",
        country: user.country || defaultCountry,
        state: user.state || "",
        city: user.city || "",
      });
    } catch { setError("Error al cargar el perfil"); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleSaveNegocio = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!formNegocio.name.trim()) return setError("Nombre del negocio requerido");
    if (!formNegocio.state.trim()) return setError("Estado es requerido");
    if (!formNegocio.city.trim()) return setError("Ciudad es requerida");
    if (!formNegocio.address.trim()) return setError("Dirección es requerida");

    try {
      await axios.put("/profile/business", formNegocio);
      localStorage.setItem("businessName", formNegocio.name);
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

    if (!formUsuario.name.trim()) return setError("Nombre del propietario requerido");
    if (!formUsuario.lastName.trim()) return setError("Apellido del propietario requerido");
    if (!formUsuario.birthDate) return setError("Fecha de nacimiento requerida");
    if (!formUsuario.state.trim()) return setError("Estado es requerido");
    if (!formUsuario.city.trim()) return setError("Ciudad es requerida");

    try {
      await axios.put("/profile/user", {
        ...formUsuario,
        birthDate: formUsuario.birthDate || null,
      });
      setSuccess("Datos del propietario actualizados");
      setEditMode(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar");
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Solo formatos JPG, PNG o WEBP permitidos");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("El archivo debe pesar menos de 3MB");
      return;
    }

    const fd = new FormData();
    fd.append("logo", file);
    setUploading(true);
    setError("");
    try {
      await axios.post("/profile/business/logo", fd);
      setSuccess("Logo actualizado correctamente");
      setLogoBroken(false);
      cargar();
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Error al subir el logo";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  const { user, business } = data || {};
  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const logoUrl = business?.logo && !logoBroken
    ? (business.logo.startsWith("http") ? business.logo : `${apiBase}${business.logo}`)
    : null;

  const estadosNegocio = estadosMexico;
  const estadosUsuario = estadosMexico;

  const perfilCompleto = () => {
    const b = formNegocio;
    const u = formUsuario;
    return !!(
      b.name.trim() && b.state.trim() && b.city.trim() && b.address.trim() &&
      u.name.trim() && u.lastName.trim() && u.birthDate && u.state.trim() && u.city.trim()
    );
  };

  const SelectField = ({ icon, label, value, onChange, options, placeholder }) => (
    <div style={styles.fieldWrap}>
      <label style={styles.label}><i className={`fa ${icon}`} style={styles.labelIcon} />{label}</label>
      <select style={{ ...styles.input, appearance: "auto" }} value={value} onChange={onChange}>
        <option value="">{placeholder || "Seleccionar..."}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

      {!perfilCompleto() && (
        <div style={{ background: "#fff4e5", border: "1px solid #f5c97f", padding: "10px 14px", borderRadius: 10, color: "#8a5800", fontWeight: 600 }}>
          Completa tu perfil: estado, ciudad y dirección en negocio + propietario.
        </div>
      )}

      {/* TARJETA NEGOCIO */}
      <div style={styles.card}>
        <div style={{ ...styles.cardHeader, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              onClick={() => logoRef.current && logoRef.current.click()}
              style={{
                width: 52, height: 52, borderRadius: 12, cursor: "pointer",
                background: logoUrl ? "none" : "linear-gradient(135deg,#6372ff,#5ca9fb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", border: logoUrl ? "2px solid #e8eaff" : "none",
                position: "relative",
              }}
              title="Haz clic para cambiar el logo"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => setLogoBroken(true)}
                />
              ) : (
                <i className="fa fa-camera" style={{ color: "#fff", fontSize: 20 }} />
              )}
              {uploading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa fa-spinner fa-spin" style={{ color: "#fff", fontSize: 16 }} />
                </div>
              )}
            </div>
            <input type="file" ref={logoRef} accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleLogoUpload} />
            <div>
              <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>Informacion del negocio</div>
              <div style={{ fontSize: 12, color: "#9599b3" }}>{business?.category || "Sin categoria"}</div>
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
            <div style={{ ...styles.formGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-tag" style={styles.labelIcon} />Nombre del negocio *</label>
                <input style={styles.input} value={formNegocio.name}
                  onChange={(e) => setFormNegocio({ ...formNegocio, name: e.target.value })} required placeholder="Tienda El Sol" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-list" style={styles.labelIcon} />Categoria</label>
                <input style={styles.input} placeholder="Abarrotes, Ropa, Electronica..."
                  value={formNegocio.category}
                  onChange={(e) => setFormNegocio({ ...formNegocio, category: e.target.value })} />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-flag" style={styles.labelIcon} />País</label>
                <input style={{ ...styles.input, background: "#f0f2ff", cursor: "not-allowed" }} value="Mexico" disabled />
              </div>
              <SelectField icon="fa-map" label="Estado / Departamento" value={formNegocio.state}
                onChange={(e) => setFormNegocio({ ...formNegocio, state: e.target.value })}
                options={estadosNegocio} placeholder="Selecciona estado" />
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-map-pin" style={styles.labelIcon} />Ciudad</label>
                <input style={styles.input} placeholder="Ej: Guadalajara"
                  value={formNegocio.city}
                  onChange={(e) => setFormNegocio({ ...formNegocio, city: e.target.value })} />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-map-marker" style={styles.labelIcon} />Direccion</label>
                <input style={styles.input} placeholder="Calle 5 de Mayo #10, Col. Centro"
                  value={formNegocio.address}
                  onChange={(e) => setFormNegocio({ ...formNegocio, address: e.target.value })} />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-phone" style={styles.labelIcon} />Telefono</label>
                <input style={styles.input} placeholder="555-123-4567"
                  value={formNegocio.phone}
                  onChange={(e) => setFormNegocio({ ...formNegocio, phone: e.target.value })} />
              </div>
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}><i className="fa fa-align-left" style={styles.labelIcon} />Descripcion</label>
                <textarea style={{ ...styles.input, resize: "vertical", minHeight: 70 }} rows={3}
                  placeholder="A que se dedica tu negocio?"
                  value={formNegocio.description}
                  onChange={(e) => setFormNegocio({ ...formNegocio, description: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" style={styles.btnSave}>
                <i className="fa fa-save" style={{ marginRight: 8 }} />Guardar cambios
              </button>
              <button type="button" style={styles.btnCancel} onClick={() => setEditMode(null)}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div style={{ ...styles.infoGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <InfoRow icon="fa-tag"         label="Nombre"      value={business?.name} />
            <InfoRow icon="fa-list"        label="Categoria"   value={business?.category} />
            <InfoRow icon="fa-flag"        label="Pais"        value={business?.country} />
            <InfoRow icon="fa-map"         label="Estado"      value={business?.state} />
            <InfoRow icon="fa-map-pin"     label="Ciudad"      value={business?.city} />
            <InfoRow icon="fa-map-marker"  label="Direccion"   value={business?.address} />
            <InfoRow icon="fa-phone"       label="Telefono"    value={business?.phone} />
            <InfoRow icon="fa-align-left"  label="Descripcion" value={business?.description} span />
            <InfoRow icon="fa-link"        label="Slug"        value={business?.slug} note="Identificador unico" />
          </div>
        )}
      </div>

      {/* TARJETA PROPIETARIO */}
      <div style={styles.card}>
        <div style={{ ...styles.cardHeader, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6372ff,#5ca9fb)",
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
            <div style={{ ...styles.formGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-user" style={styles.labelIcon} />Nombre *</label>
                <input style={styles.input} value={formUsuario.name}
                  onChange={(e) => setFormUsuario({ ...formUsuario, name: e.target.value })} required placeholder="Juan" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-user" style={styles.labelIcon} />Apellido *</label>
                <input style={styles.input} value={formUsuario.lastName}
                  onChange={(e) => setFormUsuario({ ...formUsuario, lastName: e.target.value })} required placeholder="Lopez Garcia" />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-calendar" style={styles.labelIcon} />Fecha de nacimiento</label>
                <input style={styles.input} type="date" value={formUsuario.birthDate}
                  onChange={(e) => setFormUsuario({ ...formUsuario, birthDate: e.target.value })} />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-flag" style={styles.labelIcon} />País</label>
                <input style={{ ...styles.input, background: "#f0f2ff", cursor: "not-allowed" }} value="Mexico" disabled />
              </div>
              <SelectField icon="fa-map" label="Estado / Departamento" value={formUsuario.state}
                onChange={(e) => setFormUsuario({ ...formUsuario, state: e.target.value })}
                options={estadosUsuario} placeholder="Selecciona estado" />
              <div style={styles.fieldWrap}>
                <label style={styles.label}><i className="fa fa-map-pin" style={styles.labelIcon} />Ciudad</label>
                <input style={styles.input} placeholder="Ej: Monterrey"
                  value={formUsuario.city}
                  onChange={(e) => setFormUsuario({ ...formUsuario, city: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" style={styles.btnSave}>
                <i className="fa fa-save" style={{ marginRight: 8 }} />Guardar cambios
              </button>
              <button type="button" style={styles.btnCancel} onClick={() => setEditMode(null)}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div style={{ ...styles.infoGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <InfoRow icon="fa-user"     label="Nombre"     value={user?.name} />
            <InfoRow icon="fa-user"     label="Apellido"   value={user?.lastName} />
            <InfoRow icon="fa-calendar" label="Nacimiento" value={user?.birthDate ? new Date(user.birthDate).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : null} />
            <InfoRow icon="fa-flag"     label="Pais"       value={user?.country} />
            <InfoRow icon="fa-map"      label="Estado"     value={user?.state} />
            <InfoRow icon="fa-map-pin"  label="Ciudad"     value={user?.city} />
            <InfoRow icon="fa-envelope" label="Email"      value={user?.email} note="El email no se puede cambiar" />
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
      {value || "Sin informacion"}
    </div>
    {note && <div style={{ fontSize: 11, color: "#aaa" }}>{note}</div>}
  </div>
);

const styles = {
  card: {
    background: "#fff", borderRadius: 14, padding: "22px 24px",
    boxShadow: "0 2px 12px rgba(99,114,255,0.08)", border: "1px solid #eef0ff",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22,
    paddingBottom: 16, borderBottom: "1px solid #f4f4f8",
  },
  infoGrid: { display: "grid", gap: "18px 40px" },
  formGrid: { display: "grid", gap: 16 },
  fieldWrap: { display: "flex", flexDirection: "column" },
  label: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#888", marginBottom: 6,
    fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
  },
  labelIcon: { color: "#6372ff", fontSize: 12 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8",
    fontSize: 14, color: "#1a1a2e", fontWeight: 600, outline: "none",
    boxSizing: "border-box", background: "#fafafa",
  },
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
  alertError: {
    background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8,
    border: "1px solid #ffd0d8", display: "flex", alignItems: "center",
  },
  alertSuccess: {
    background: "#f0f4ff", color: "#4050cc", padding: "10px 16px", borderRadius: 8,
    border: "1px solid #c8ccff", display: "flex", alignItems: "center",
  },
};

export default MiNegocio;
