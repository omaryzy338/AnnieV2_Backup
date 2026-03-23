import React, { useState } from "react";
import axios from "../api/axiosConfig";
import { useNavigate, Link } from "react-router-dom";
import useWindowWidth from "../hooks/useWindowWidth";

const Login = () => {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
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
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", form);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.page, flexDirection: isMobile ? "column" : "row" }}>
      {/* Panel izquierdo — decorativo */}
      {!isMobile && (
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.brand}>ANNIE</div>
          <div style={styles.brandSub}>Gestión empresarial para emprendedores</div>
          <div style={styles.decorCircle1} />
          <div style={styles.decorCircle2} />
        </div>
      </div>
      )}

      {/* Panel derecho — formulario */}
      <div style={styles.rightPanel}>
        <div style={{ ...styles.card, padding: isMobile ? "28px 20px" : "44px 40px", position: "relative" }}>
          {/* Botón volver */}
          <button onClick={() => navigate("/")} style={styles.btnBack}>
            <i className="fa fa-arrow-left" style={{ marginRight: 6 }} />Volver
          </button>

          {/* Logo móvil */}
          {isMobile && <div style={{ ...styles.mobileBrand, display: "block" }}>ANNIE</div>}

          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}>
              <i className="fa fa-sign-in" style={{ color: "#fff", fontSize: 22 }} />
            </div>
            <h2 style={styles.title}>Bienvenido de vuelta</h2>
            <p style={styles.subtitle}>Inicia sesión en tu cuenta</p>
          </div>

          {error && (
            <div style={styles.alertError}>
              <i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>
                <i className="fa fa-envelope" style={styles.labelIcon} />Correo electrónico
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

            <style>{`
        input[type=password]::-ms-clear, input[type=password]::-ms-reveal { display: none; }
        input[type=password]::-webkit-textfield-decoration-container { display: none; }
        input[type=password]::-webkit-credentials-auto-fill-button { display: none !important; }
      `}</style>
      <div style={styles.fieldWrap}>
              <label style={styles.label}>
                <i className="fa fa-lock" style={styles.labelIcon} />Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...styles.input, WebkitTextSecurity: showPass ? "none" : "disc" }}
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  inputMode="text"
                />
                <span onClick={() => setShowPass((p) => !p)}
                  style={{ ...styles.eyeBtn, cursor: "pointer", background: "none", border: "none" }}>
                  <i className={`fa ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
                </span>
              </div>
            </div>

            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading
                ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 8 }} />Entrando...</>
                : <><i className="fa fa-sign-in" style={{ marginRight: 8 }} />Iniciar sesión</>
              }
            </button>
          </form>

          <p style={styles.switchText}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" style={styles.switchLink}>Regístrate aquí</Link>
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
    "@media (max-width: 768px)": { display: "none" },
  },
  leftContent: {
    textAlign: "center", color: "#fff", position: "relative", zIndex: 1, padding: 40,
  },
  brand: {
    fontSize: 52, fontWeight: 900, letterSpacing: 4, color: "#fff",
    textShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  brandSub: {
    fontSize: 15, color: "rgba(255,255,255,0.85)", marginTop: 10, fontWeight: 400,
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
    background: "#f4f6fb", padding: "40px 24px",
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "44px 40px",
    boxShadow: "0 8px 40px rgba(99,114,255,0.13)",
    width: "100%", maxWidth: 420,
    border: "1px solid #eef0ff",
  },
  mobileBrand: {
    display: "none", textAlign: "center", fontSize: 28, fontWeight: 900,
    color: "#6372ff", letterSpacing: 3, marginBottom: 20,
  },
  cardHeader: { textAlign: "center", marginBottom: 28 },
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
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: "1.5px solid #e8e8e8", fontSize: 14, color: "#1a1a2e",
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
  switchText: { textAlign: "center", marginTop: 22, color: "#aaa", fontSize: 13 },
  switchLink: { color: "#6372ff", fontWeight: 700, textDecoration: "none" },
  btnBack: {
    position: "absolute", top: 16, left: 16,
    background: "none", border: "1.5px solid #e0e0e0", borderRadius: 8,
    padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 12,
    fontWeight: 600, display: "inline-flex", alignItems: "center",
    transition: "all 0.15s",
  },
};

export default Login;

