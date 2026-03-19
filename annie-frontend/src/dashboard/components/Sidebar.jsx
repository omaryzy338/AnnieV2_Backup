import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "../../api/axiosConfig";

const links = [
  { to: "/dashboard",           icon: "fa-home",          label: "Inicio" },
  { to: "/dashboard/productos",  icon: "fa-cube",          label: "Productos" },
  { to: "/dashboard/ventas",     icon: "fa-shopping-cart", label: "Ventas" },
  { to: "/dashboard/clientes",   icon: "fa-users",         label: "Clientes" },
  { to: "/dashboard/reportes",   icon: "fa-bar-chart",     label: "Reportes" },
  { to: "/dashboard/negocio",    icon: "fa-briefcase",     label: "Mi Negocio" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [businessName, setBusinessName] = useState("Mi Tienda");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData(stored);

    // Si el token no tiene businessName, lo cargamos del backend
    if (!stored.businessName) {
      axios.get("/profile").then((res) => {
        setBusinessName(res.data.business?.name || "Mi Tienda");
        // actualizar localStorage con el dato
        const updated = { ...stored, businessName: res.data.business?.name };
        localStorage.setItem("user", JSON.stringify(updated));
        setUserData(updated);
      }).catch(() => {});
    } else {
      setBusinessName(stored.businessName);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const initials = userData?.name ? userData.name[0].toUpperCase() : "U";

  return (
    <div style={styles.sidebar}>
      {/* Logo / Nombre del negocio */}
      <div style={styles.brand}>
        <span>{businessName}</span>
      </div>

      {/* Info del usuario */}
      <div style={styles.userInfo}>
        <div style={styles.avatar}>{initials}</div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: 14, color: "#1a1a2e" }}>
            {userData?.name} {userData?.lastName}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>{userData?.email}</div>
        </div>
      </div>

      <hr style={{ borderColor: "rgba(0,0,0,0.08)", margin: "10px 0" }} />

      {/* Navegación */}
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard"}
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
    background: "#fff",
    color: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 100,
    boxShadow: "2px 0 10px rgba(0,0,0,0.07)",
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
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 20px",
    color: "#555",
    textDecoration: "none",
    fontSize: 15,
    borderRadius: 6,
    margin: "2px 8px",
    transition: "background 0.2s, color 0.2s",
  },
  logoutBtn: {
    marginTop: "auto",
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 8,
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
  },
};

export default Sidebar;
