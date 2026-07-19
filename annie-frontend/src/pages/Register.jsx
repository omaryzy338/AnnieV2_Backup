import React, { useState } from "react";
import axios from "../api/axiosConfig";
import { useNavigate, Link } from "react-router-dom";
import useWindowWidth from "../hooks/useWindowWidth";

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const RFC_FISICA = /^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;
const RFC_MORAL  = /^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;

const Register = () => {
  const [form, setForm] = useState({
    name: "", lastName: "", businessName: "",
    email: "", password: "", confirmPassword: "", rfc: "",
  });
  const [logoFile, setLogoFile]   = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("La imagen no debe superar 3 MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < 768;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!passwordRegex.test(form.password)) {
      setError("La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial");
      return;
    }
    if (form.rfc.trim() && !RFC_FISICA.test(form.rfc.trim().toUpperCase()) && !RFC_MORAL.test(form.rfc.trim().toUpperCase())) {
      setError("El RFC no tiene un formato válido (física=13, moral=12 caracteres)");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/auth/register", {
        name:         form.name,
        lastName:     form.lastName,
        businessName: form.businessName,
        email:        form.email,
        password:     form.password,
        rfc:          form.rfc.trim() || undefined,
      });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // Subir foto del negocio si se seleccionó
      if (logoFile) {
        try {
          const fd = new FormData();
          fd.append("logo", logoFile);
          await axios.post("/profile/business/logo", fd, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
          });
        } catch (_) { /* no bloquear registro si falla la foto */ }
      }

      navigate("/dashboard/mi-negocio");
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.page, flexDirection: isMobile ? "column" : "row" }}>
      {/* Panel izquierdo */}
      {!isMobile && (
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.brand}>ANNIE</div>
          <div style={styles.brandSub}>Gestión empresarial para emprendedores</div>
          <div style={styles.features}>
            {[
              { icon: "fa-bar-chart",  text: "Reportes y estadísticas" },
              { icon: "fa-cube",       text: "Control de inventario" },
              { icon: "fa-users",      text: "Gestión de clientes" },
              { icon: "fa-money",      text: "Registro de ventas" },
            ].map(({ icon, text }) => (
              <div key={text} style={styles.featureItem}>
                <i className={`fa ${icon}`} style={{ color: "rgba(255,255,255,0.9)", fontSize: 15 }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div style={styles.decorCircle1} />
          <div style={styles.decorCircle2} />
        </div>
      </div>
      )}

      {/* Panel derecho */}
      <div style={styles.rightPanel}>
        <div style={{ ...styles.card, padding: isMobile ? "28px 20px" : "36px 34px", position: "relative" }}>
          {/* Botón volver */}
          <button onClick={() => navigate("/")} style={styles.btnBack}>
            <i className="fa fa-arrow-left" style={{ marginRight: 6 }} />Volver
          </button>

          {isMobile && <div style={{ ...styles.mobileBrand, display: "block" }}>ANNIE</div>}

          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}>
              <i className="fa fa-user-plus" style={{ color: "#fff", fontSize: 20 }} />
            </div>
            <h2 style={styles.title}>Crear cuenta</h2>
            <p style={styles.subtitle}>Empieza a gestionar tu negocio hoy</p>
          </div>

          {error && (
            <div style={styles.alertError}>
              <i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Fila nombre + apellido */}
            <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ ...styles.fieldWrap, flex: 1 }}>
                <label style={styles.label}>
                  <i className="fa fa-user" style={styles.labelIcon} />Nombre *
                </label>
                <input
                  style={styles.input}
                  type="text" name="name"
                  placeholder="Juan"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ ...styles.fieldWrap, flex: 1 }}>
                <label style={styles.label}>
                  <i className="fa fa-user" style={styles.labelIcon} />Apellido *
                </label>
                <input
                  style={styles.input}
                  type="text" name="lastName"
                  placeholder="García"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>
                <i className="fa fa-building" style={styles.labelIcon} />Nombre del negocio *
              </label>
              <input
                style={styles.input}
                type="text" name="businessName"
                placeholder="Ej: Tienda El Sol"
                value={form.businessName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Foto del negocio (opcional) */}
            <div style={styles.fieldWrap}>
              <label style={styles.label}>
                <i className="fa fa-camera" style={styles.labelIcon} />Foto de tu negocio
                <span style={{ fontWeight: 400, textTransform: "none", color: "#bbb", marginLeft: 4 }}>(opcional)</span>
              </label>
              <label htmlFor="logo-upload" style={styles.logoUploadArea}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" style={styles.logoPreviewImg} />
                ) : (
                  <>
                    <i className="fa fa-camera" style={{ fontSize: 24, color: "#6372ff", marginBottom: 6 }} />
                    <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Toca para subir imagen</span>
                    <span style={{ fontSize: 11, color: "#bbb" }}>JPG, PNG o WebP · máx 3 MB</span>
                  </>
                )}
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogo}
                style={{ display: "none" }}
              />
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>
                <i className="fa fa-id-card-o" style={styles.labelIcon} />RFC de tu negocio
                <span style={{ fontWeight: 400, textTransform: "none", color: "#bbb", marginLeft: 4 }}>(opcional)</span>
              </label>
              <input
                style={styles.input}
                type="text" name="rfc"
                placeholder="Ej: XAXX010101000"
                value={form.rfc}
                onChange={(e) => setForm((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                maxLength={13}
              />
              <span style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                Si lo dejas vacío, se te asigna un RFC genérico. Podrás cambiarlo después en
                "Mi Negocio", pero necesitas uno real para poder ofrecer crédito a tus clientes.
              </span>
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>
                <i className="fa fa-envelope" style={styles.labelIcon} />Correo electrónico *
              </label>
              <input
                style={styles.input}
                type="email" name="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>



            <div style={styles.fieldWrap}>
              <label style={styles.label}>
                <i className="fa fa-lock" style={styles.labelIcon} />Contraseña *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  style={styles.input}
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="Min. 8 chars, 1 mayús., 1 número, 1 especial"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  style={styles.eyeBtn}>
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
                  borderColor: form.confirmPassword && form.confirmPassword !== form.password ? "#e94560" : "#e8e8e8",
                }}
                type={showPass ? "text" : "password"}
                name="confirmPassword"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div style={styles.securityNote}>
              <i className="fa fa-lock" style={{ color: "#27ae60", marginRight: 8 }} />
              Tus datos están seguros y protegidos. Usamos contraseñas cifradas y nunca compartimos tu información.
            </div>

            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading
                ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 8 }} />Creando cuenta...</>
                : <><i className="fa fa-check" style={{ marginRight: 8 }} />Crear cuenta</>
              }
            </button>
          </form>

          <p style={styles.switchText}>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" style={styles.switchLink}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif",
  },
  leftPanel: {
    flex: 1, background: "linear-gradient(135deg, #6372ff 0%, #5ca9fb 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden",
  },
  leftContent: {
    textAlign: "center", color: "#fff", position: "relative", zIndex: 1, padding: 40,
  },
  brand: {
    fontSize: 52, fontWeight: 900, letterSpacing: 4, color: "#fff",
    textShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  brandSub: {
    fontSize: 15, color: "rgba(255,255,255,0.85)", marginTop: 10, marginBottom: 32, fontWeight: 400,
  },
  features: { display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", textAlign: "left" },
  featureItem: {
    display: "flex", alignItems: "center", gap: 10,
    color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 500,
  },
  decorCircle1: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    background: "rgba(255,255,255,0.08)", top: -80, right: -80,
  },
  decorCircle2: {
    position: "absolute", width: 200, height: 200, borderRadius: "50%",
    background: "rgba(255,255,255,0.06)", bottom: -50, left: -50,
  },
  rightPanel: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    background: "#f4f6fb", padding: "40px 24px", overflowY: "auto",
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "36px 34px",
    boxShadow: "0 8px 40px rgba(99,114,255,0.13)",
    width: "100%", maxWidth: 490,
    border: "1px solid #eef0ff",
  },
  mobileBrand: {
    display: "none", textAlign: "center", fontSize: 28, fontWeight: 900,
    color: "#6372ff", letterSpacing: 3, marginBottom: 20,
  },
  cardHeader: { textAlign: "center", marginBottom: 24 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    background: "linear-gradient(135deg, #6372ff, #5ca9fb)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 4px 16px rgba(99,114,255,0.35)",
  },
  title: { margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#1a1a2e" },
  subtitle: { margin: 0, color: "#9599b3", fontSize: 14 },
  fieldWrap: { display: "flex", flexDirection: "column" },
  label: {
    fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 7,
    textTransform: "uppercase", letterSpacing: 0.5,
    display: "flex", alignItems: "center", gap: 6,
  },
  labelIcon: { color: "#6372ff", fontSize: 12 },
  input: {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #e8e8e8", fontSize: 13, color: "#1a1a2e",
    fontWeight: 600, outline: "none", boxSizing: "border-box",
    background: "#fafafa", transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 15, padding: 4,
  },
  btnSubmit: {
    width: "100%", padding: "13px", borderRadius: 10, border: "none",
    background: "linear-gradient(to right, #6372ff, #5ca9fb)",
    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(99,114,255,0.35)",
    marginTop: 4,
  },
  alertError: {
    background: "#fff0f3", color: "#c0392b", padding: "10px 14px",
    borderRadius: 8, border: "1px solid #ffd0d8",
    fontSize: 13, display: "flex", alignItems: "center", marginBottom: 4,
  },
  securityNote: {
    background: "#f0fff4", color: "#1a7c40", padding: "10px 14px",
    borderRadius: 8, border: "1px solid #b7f0cc",
    fontSize: 12, display: "flex", alignItems: "center", lineHeight: 1.4,
  },
  switchText: { textAlign: "center", marginTop: 20, color: "#aaa", fontSize: 13 },
  switchLink: { color: "#6372ff", fontWeight: 700, textDecoration: "none" },
  btnBack: {
    position: "absolute", top: 16, left: 16,
    background: "none", border: "1.5px solid #e0e0e0", borderRadius: 8,
    padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 12,
    fontWeight: 600, display: "inline-flex", alignItems: "center",
    transition: "all 0.15s",
  },
  logoUploadArea: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    border: "2px dashed #d5d8f0", borderRadius: 12, padding: "16px 12px",
    cursor: "pointer", background: "#f8f9ff", transition: "border-color 0.2s",
    minHeight: 90, textAlign: "center", gap: 2,
  },
  logoPreviewImg: {
    width: 80, height: 80, objectFit: "cover", borderRadius: 12,
  },
};

export default Register;

