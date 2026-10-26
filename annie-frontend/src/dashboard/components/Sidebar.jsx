import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "../../api/axiosConfig";
import { resolveMediaUrl } from "../../utils/media";
import { initials as iniciales } from "../../utils/format";
import { EVENTO_PERFIL, avisarPerfilActualizado } from "../../utils/eventos";
import { ROL_DUENO, esDueno, leerUsuario, nombreRol } from "../../utils/sesion";

// soloDueno: secciones que no se le muestran a un empleado
const links = [
  { to: "/dashboard",           icon: "fa-home",          label: "Inicio" },
  { to: "/dashboard/productos",  icon: "fa-cube",          label: "Productos" },
  { to: "/dashboard/ventas",     icon: "fa-shopping-cart", label: "Ventas" },
  { to: "/dashboard/clientes",   icon: "fa-users",         label: "Clientes" },
  { to: "/dashboard/creditos",   icon: "fa-credit-card",   label: "Créditos" },
  { to: "/dashboard/reportes",   icon: "fa-bar-chart",     label: "Reportes",   soloDueno: true },
  { to: "/dashboard/mi-negocio", icon: "fa-briefcase",     label: "Mi Negocio", soloDueno: true },
  { to: "/dashboard/empleados",  icon: "fa-id-badge",      label: "Empleados",  soloDueno: true },
];

const Sidebar = ({ isMobile, isOpen, onClose }) => {
  const navigate = useNavigate();
  // Se lee desde el primer render para que un empleado no vea, ni por un
  // instante, las secciones del dueño
  const [userData, setUserData] = useState(leerUsuario);
  const [businessName, setBusinessName] = useState("Mi Tienda");
  const [businessLogo, setBusinessLogo] = useState(null);

  useEffect(() => {
    // Lee la sesión guardada; si le falta el nombre o logo del negocio o el
    // rol (las sesiones anteriores a los empleados no lo guardaban), o se
    // pide refrescar, los trae del backend
    const cargar = (refrescar) => {
      const stored = leerUsuario();
      setUserData(stored);
      setBusinessLogo(stored.businessLogo || null);
      if (stored.businessName) setBusinessName(stored.businessName);

      if (refrescar || !stored.businessName || !stored.businessLogo || !stored.rol) {
        axios.get("/profile").then((res) => {
          const name = res.data.business?.name || "Mi Tienda";
          const logo = resolveMediaUrl(res.data.business?.logo);

          setBusinessName(name);
          setBusinessLogo(logo);

          // actualizar localStorage con los datos
          const updated = {
            ...stored,
            name: res.data.user?.name || stored.name,
            lastName: res.data.user?.lastName ?? stored.lastName,
            // Un usuario sin rol es el dueño (cuentas creadas antes de los empleados)
            rol: res.data.user?.rol || stored.rol || ROL_DUENO,
            businessName: name,
            businessLogo: logo,
          };
          localStorage.setItem("user", JSON.stringify(updated));
          setUserData(updated);
          // Si con el rol del backend cambia lo que puede hacer, se avisa al
          // panel y a las páginas para que lo vuelvan a leer (la segunda
          // lectura ya no cambia nada, así que no se repite)
          if (esDueno(updated) !== esDueno(stored)) avisarPerfilActualizado();
        }).catch(() => {
          // sin conexión: se queda lo que había en localStorage
        });
      }
    };

    cargar(false);

    // Mi Negocio avisa cuando cambian el nombre, el logo o el propietario
    const onPerfilActualizado = () => cargar(true);
    window.addEventListener(EVENTO_PERFIL, onPerfilActualizado);
    return () => window.removeEventListener(EVENTO_PERFIL, onPerfilActualizado);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  const initials = userData?.name ? iniciales(userData) : "U";
  const dueno = esDueno(userData);

  const sidebarStyle = isMobile
    ? {
        ...styles.sidebar,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        zIndex: 200,
      }
    : styles.sidebar;

  return (
    <div style={sidebarStyle}>
      {/* Logo / Nombre del negocio */}
      <div style={styles.brand}>
        <span>{businessName}</span>
      </div>

      {/* Info del usuario */}
      <div style={styles.userInfo}>
        <div style={styles.avatar}>
          {businessLogo ? (
            <img src={businessLogo} alt="Logo negocio" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          ) : (
            initials
          )}
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: 14, color: "#1a1a2e" }}>
            {userData?.name} {userData?.lastName}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>{userData?.email}</div>
          {/* En móvil la barra superior no muestra al usuario: el rol va aquí */}
          {isMobile && <span style={styles.rol}>{nombreRol(userData)}</span>}
        </div>
      </div>

      <hr style={{ borderColor: "rgba(0,0,0,0.08)", margin: "10px 0" }} />

      {/* Navegación */}
      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: 75 }}>
        {links.filter((link) => dueno || !link.soloDueno).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard"}
            onClick={handleNavClick}
            style={({ isActive }) => ({
              ...styles.navLink,
              background: isActive ? "linear-gradient(to right, #6372ff, #5ca9fb)" : "transparent",
              color: isActive ? "#fff" : "#555",
              fontWeight: isActive ? "bold" : "normal",
            })}
          >
            <i className={`fa ${link.icon}`} style={{ width: 20, fontSize: 16, textAlign: "center", flexShrink: 0 }} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <button onClick={handleLogout} style={styles.logoutBtn}>
        <i className="fa fa-sign-out" style={{ marginRight: 8 }} />
        Cerrar sesión
      </button>
    </div>
  );
};

const styles = {
  sidebar: {
    width: 240,
    minHeight: "100vh",
    maxHeight: "100vh",
    background: "#fff",
    color: "#1a1a2e",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    boxShadow: "2px 0 10px rgba(0,0,0,0.07)",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  brand: {
    fontSize: 16,
    fontWeight: "bold",
    padding: "0 20px 16px",
    color: "#1a1a2e",
    letterSpacing: 0.3,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 20px 10px",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6372ff, #5ca9fb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: 16,
    flexShrink: 0,
  },
  rol: {
    display: "inline-block",
    marginTop: 4,
    fontSize: 10,
    fontWeight: 700,
    color: "#6372ff",
    background: "#f0f2ff",
    border: "1px solid #d6dbff",
    borderRadius: 6,
    padding: "1px 7px",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 20px",
    color: "#555",
    textDecoration: "none",
    fontSize: 15,
    lineHeight: "1.5",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    letterSpacing: "0.2px",
    borderRadius: 6,
    margin: "2px 8px",
    transition: "background 0.2s, color 0.2s",
  },
  logoutBtn: {
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 12,
    background: "#fff0f3",
    color: "#e05555",
    border: "1.5px solid #ffd0d8",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "sticky",
    bottom: 12,
    zIndex: 5,
  },
};

export default Sidebar;
