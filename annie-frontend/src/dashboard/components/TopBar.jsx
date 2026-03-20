import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosConfig";

const TopBar = () => {
  const [busqueda, setBusqueda]   = useState("");
  const [showDrop, setShowDrop]   = useState(false);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes]   = useState([]);
  const wrapperRef = useRef(null);
  const navigate   = useNavigate();

  const user         = JSON.parse(localStorage.getItem("user") || "{}");
  const inicial      = user.name ? user.name.charAt(0).toUpperCase() : "?";
  const nombreCompleto = user.name ? `${user.name} ${user.lastName || ""}`.trim() : null;

  // Carga datos una sola vez al montar
  useEffect(() => {
    const cargar = async () => {
      try {
        const [rP, rC] = await Promise.all([axios.get("/products"), axios.get("/clients")]);
        setProductos(rP.data);
        setClientes(rC.data);
      } catch {}
    };
    cargar();
  }, []);

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const PAGINAS = [
    { label: "Inicio",      ruta: "/dashboard",            icon: "fa-home",        keywords: ["inicio", "home", "dashboard", "principio"] },
    { label: "Productos",   ruta: "/dashboard/productos",   icon: "fa-cube",        keywords: ["productos", "producto", "inventario", "stock", "articulos"] },
    { label: "Ventas",      ruta: "/dashboard/ventas",      icon: "fa-shopping-cart", keywords: ["ventas", "venta", "pedidos", "ordenes", "cobros"] },
    { label: "Clientes",    ruta: "/dashboard/clientes",    icon: "fa-users",       keywords: ["clientes", "cliente", "personas", "compradores"] },
    { label: "Reportes",    ruta: "/dashboard/reportes",    icon: "fa-bar-chart",   keywords: ["reportes", "reporte", "estadisticas", "graficas", "analisis"] },
    { label: "Mi Negocio",  ruta: "/dashboard/mi-negocio", icon: "fa-building",    keywords: ["negocio", "empresa", "mi negocio", "perfil negocio", "configuracion"] },
  ];

  const q         = busqueda.trim().toLowerCase();
  const matchProd = q.length >= 2 ? productos.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5) : [];
  const matchCli  = q.length >= 2 ? clientes.filter((c) => `${c.name} ${c.lastName || ""}`.toLowerCase().includes(q)).slice(0, 5) : [];
  const matchPag  = q.length >= 2 ? PAGINAS.filter((pg) => pg.keywords.some((k) => k.includes(q))) : [];
  const hayResultados = matchProd.length > 0 || matchCli.length > 0 || matchPag.length > 0;

  const handleSelect = (ruta) => {
    setBusqueda("");
    setShowDrop(false);
    navigate(ruta);
  };

  return (
    <div style={styles.topbar}>
      {/* Buscador */}
      <div ref={wrapperRef} style={styles.searchWrapper}>
        <i className="fa fa-search" style={styles.searchIcon} />
        <input
          style={styles.searchInput}
          placeholder="Buscar productos, clientes..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setShowDrop(true); }}
          onFocus={() => q.length >= 2 && setShowDrop(true)}
          onKeyDown={(e) => e.key === "Escape" && (setShowDrop(false))}
        />
        {busqueda && (
          <button style={styles.clearBtn} onClick={() => { setBusqueda(""); setShowDrop(false); }}>
            <i className="fa fa-times" />
          </button>
        )}

        {/* Dropdown de resultados */}
        {showDrop && q.length >= 2 && (
          <div style={styles.dropdown}>
            {!hayResultados && (
              <div style={styles.dropEmpty}>Sin resultados para "<strong>{busqueda}</strong>"</div>
            )}

            {matchProd.length > 0 && (
              <>
                <div style={styles.dropLabel}>
                  <i className="fa fa-cube" style={{ marginRight: 6 }} />Productos
                </div>
                {matchProd.map((p) => (
                  <button key={p._id} style={styles.dropItem}
                    onClick={() => handleSelect("/dashboard/productos")}>
                    {p.image ? (
                      <img src={p.image.startsWith("/uploads") ? `http://localhost:5000${p.image}` : p.image}
                        alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 6,
                          border: "1px solid #e8eaff", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "#f0f2ff",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className="fa fa-cube" style={{ color: "#c8ccff", fontSize: 12 }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                      <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize: 11, color: "#9599b3" }}>{p.brand}</div>}
                    </div>
                    <span style={{ color: "#6372ff", fontWeight: 700, fontSize: 13, flexShrink: 0, marginLeft: 8 }}>
                      ${p.price}
                    </span>
                  </button>
                ))}
              </>
            )}

            {matchCli.length > 0 && (
              <>
                <div style={styles.dropLabel}>
                  <i className="fa fa-users" style={{ marginRight: 6 }} />Clientes
                </div>
                {matchCli.map((c) => (
                  <button key={c._id} style={styles.dropItem}
                    onClick={() => handleSelect("/dashboard/clientes")}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#6372ff,#5ca9fb)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: 12 }}>
                      {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                      <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name} {c.lastName || ""}
                      </div>
                      {c.phone && <div style={{ fontSize: 11, color: "#9599b3" }}>{c.phone}</div>}
                    </div>
                  </button>
                ))}
              </>
            )}

            {matchPag.length > 0 && (
              <>
                <div style={styles.dropLabel}>
                  <i className="fa fa-compass" style={{ marginRight: 6 }} />Páginas
                </div>
                {matchPag.map((pg) => (
                  <button key={pg.ruta} style={styles.dropItem}
                    onClick={() => handleSelect(pg.ruta)}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: "linear-gradient(135deg,#6372ff,#5ca9fb)",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className={`fa ${pg.icon}`} style={{ color: "#fff", fontSize: 13 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                      <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13 }}>{pg.label}</div>
                      <div style={{ fontSize: 11, color: "#9599b3" }}>Ir a la sección</div>
                    </div>
                    <i className="fa fa-arrow-right" style={{ color: "#c8ccff", fontSize: 11 }} />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Derecha: info del usuario */}
      <div style={styles.userArea}>
        {nombreCompleto && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{nombreCompleto}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>Administrador</div>
          </div>
        )}
        <div style={styles.avatar}>{inicial}</div>
      </div>
    </div>
  );
};

const styles = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 30px",
    background: "#fff",
    borderBottom: "1px solid #eee",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    flexShrink: 0,
    position: "relative",
    zIndex: 50,
  },
  searchWrapper: {
    position: "relative",
    width: 320,
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
    padding: "10px 36px 10px 40px",
    borderRadius: 10,
    border: "1.5px solid #d0d4ff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#1a1a2e",
    fontWeight: 600,
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    color: "#bbb", fontSize: 13, padding: 0,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(99,114,255,0.18)",
    border: "1.5px solid #e8eaff",
    zIndex: 200,
    overflow: "hidden",
    maxHeight: 380,
    overflowY: "auto",
  },
  dropLabel: {
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: 700,
    color: "#9599b3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    background: "#f8f9ff",
    borderBottom: "1px solid #eef0ff",
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "9px 14px",
    border: "none",
    borderBottom: "1px solid #f4f6f9",
    background: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#333",
    textAlign: "left",
    transition: "background 0.12s",
  },
  dropEmpty: {
    padding: "18px 16px",
    textAlign: "center",
    color: "#aaa",
    fontSize: 13,
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6372ff, #5ca9fb)",
    border: "none",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};

export default TopBar;

