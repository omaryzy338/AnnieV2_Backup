import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";
import useWindowWidth from "../../hooks/useWindowWidth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

const PALETTE = ["#6372ff", "#5ca9fb", "#FF9800", "#27ae60", "#9C27B0", "#e05555"];

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
    <div style={{ ...styles.cardIcon, background: color }}>
      <i className={`fa ${icon}`} style={{ color: "#fff", fontSize: 18 }} />
    </div>
    <div>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  </div>
);

const Inicio = () => {
  const [resumen, setResumen]     = useState(null);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [ventas, setVentas]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const w = useWindowWidth();
  const isMobile = w < 768;

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resRes, prodRes, cliRes, venRes] = await Promise.all([
          axios.get("/sales/resumen"),
          axios.get("/products"),
          axios.get("/clients"),
          axios.get("/sales"),
        ]);
        setResumen(resRes.data);
        setProductos(prodRes.data);
        setClientes(cliRes.data);
        setVentas(venRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  const stockBajo = productos.filter((p) => p.quantity < 5);

  // Top productos: #1 más vendido por cantidad, #2 mayor ganancia generada (sin duplicar)
  const topMapProductos = Object.values(
    ventas.reduce((acc, v) => {
      const key = v.product?._id;
      if (!key) return acc;
      if (!acc[key]) acc[key] = { nombre: v.product.name, ventas: 0, total: 0, unit: v.product.unit || "uds." };
      acc[key].ventas += v.quantity;
      acc[key].total  += v.total;
      return acc;
    }, {})
  );

  const topProductos = [...topMapProductos].sort((a, b) => b.total - a.total);
  const masVendido  = [...topMapProductos].sort((a, b) => b.ventas - a.ventas)[0]  || null;
  const masGanancia = [...topMapProductos].sort((a, b) => b.total  - a.total)[0]   || null;
  const topProductosDuo = masVendido && masGanancia && masVendido.nombre === masGanancia.nombre
    ? [{ ...masVendido, badge: "Más vendido · Más ganancia" }]
    : [
        masVendido  ? { ...masVendido,  badge: "Más vendido"  } : null,
        masGanancia ? { ...masGanancia, badge: "Más ganancia" } : null,
      ].filter(Boolean);

  const formatFecha = (iso) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Saludo */}
      <p style={{ margin: 0, color: "#1a1a2e", fontSize: 15, fontWeight: 600 }}>
        Hola, <span style={{ color: "#6372ff" }}>{user.name || "👋"}</span> — aquí está el resumen de tu negocio
      </p>

      {/* Tarjetas */}
      <div className="dash-stat-row" style={{ ...styles.cardRow, gridTemplateColumns: isMobile ? "1fr 1fr" : undefined }}>
        <StatCard icon="fa-shopping-cart" label="Total Ventas" value={`$${resumen?.totalVentas ?? 0}`} color="#6372ff" />
        <StatCard icon="fa-shopping-cart" label="Num. Ventas"  value={resumen?.cantidadVentas ?? 0}    color="#5ca9fb" />
        <StatCard icon="fa-cube"          label="Productos"    value={productos.length}                color="#FF9800" />
        <StatCard icon="fa-users"         label="Clientes"     value={clientes.length}                 color="#27ae60" />
      </div>



      {/* Grid principal: 3 columnas */}
      <div style={{ ...styles.mainGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 300px" }}>

        {/* Col 1: Gráfica barras */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={{ ...styles.dot, background: "#6372ff" }} />
            <span style={styles.sectionTitle}>Ingresos por producto</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={topProductos} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: "#888" }} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} />
              <Tooltip formatter={(v) => [`$${v}`, "Ingresos"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {topProductos.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Col 2: Gráfica pastel */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={{ ...styles.dot, background: "#5ca9fb" }} />
            <span style={styles.sectionTitle}>Distribución de ventas</span>
          </div>
          {topProductos.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={topProductos} dataKey="total" nameKey="nombre" cx="50%" cy="46%"
                  outerRadius={60} innerRadius={30} paddingAngle={2}
                  label={({ percent }) => percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={{ stroke: "#bbb", strokeWidth: 1 }}>
                  {topProductos.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [`$${v}`, name]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#bbb", textAlign: "center", padding: 20, fontSize: 13 }}>Sin datos</p>
          )}
        </div>

        {/* Col 3: Top productos + Inventario */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Top productos */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={{ ...styles.dot, background: "#FF9800" }} />
              <span style={styles.sectionTitle}>Top productos</span>
            </div>
            {topProductosDuo.length === 0 ? (
              <p style={{ color: "#bbb", textAlign: "center", fontSize: 13 }}>Sin datos</p>
            ) : (
              topProductosDuo.map((p, i) => (
                <div key={i} style={styles.topRow}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? "linear-gradient(135deg,#FF9800,#ffb74d)" : "linear-gradient(135deg,#6372ff,#5ca9fb)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`fa fa-${i === 0 ? "trophy" : "star"}`} style={{ color: "#fff", fontSize: 11 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{p.nombre}</div>
                    <div style={{ fontSize: 10, color: "#9599b3", fontWeight: 600 }}>{p.badge}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{p.ventas} {p.unit || "uds."}</div>
                  </div>
                  <strong style={{ color: "#6372ff", fontSize: 13, fontWeight: 700 }}>${p.total.toFixed(2)}</strong>
                </div>
              ))
            )}
          </div>

          {/* Inventario */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={{ ...styles.dot, background: "#5ca9fb" }} />
              <span style={styles.sectionTitle}>Estado del inventario</span>
            </div>
            {(() => {
              if (productos.length === 0) return <p style={{ color: "#bbb", textAlign: "center", fontSize: 13 }}>Sin productos</p>;
              const sorted = [...productos].sort((a, b) => a.quantity - b.quantity);
              const menor  = sorted[0];
              const mayor  = sorted[sorted.length - 1];
              const maxQ   = mayor.quantity || 1;
              return [menor, mayor]
                .filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i)
                .map((p) => {
                  const pct   = Math.min(100, Math.round((p.quantity / maxQ) * 100));
                  const color = p.quantity < 5 ? "#e94560" : p.quantity < 20 ? "#FF9800" : "#27ae60";
                  const tag   = p._id === menor._id
                    ? { label: "Menor stock", color: "#e94560", bg: "#fff0f3" }
                    : { label: "Mayor stock", color: "#27ae60", bg: "#f0fff4" };
                  return (
                    <div key={p._id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{p.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tag.color, background: tag.bg,
                            borderRadius: 4, padding: "1px 6px" }}>{tag.label}</span>
                        </div>
                        <span style={{ color, fontWeight: 700 }}>{p.quantity} {p.unit || "uds."}</span>
                      </div>
                      <div style={styles.barBg}>
                        <div style={{ ...styles.barFill, width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                });
            })()}
          </div>


        </div>
      </div>

      {/* Últimas ventas */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.dot} />
          <span style={styles.sectionTitle}>Últimas ventas</span>
        </div>
        {ventas.length === 0 ? (
          <p style={{ color: "#bbb", textAlign: "center", fontSize: 13 }}>Sin ventas registradas</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Cant.</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventas.slice(0, 1).map((v) => (
                <tr key={v._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={styles.td}>{v.product?.name || "—"}</td>
                  <td style={styles.td}><span style={{ color: v.client ? "#1a1a2e" : "#bbb", fontWeight: 600 }}>{v.client?.name || "Sin cliente"}</span></td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#1a1a2e" }}>{v.quantity}</td>
                  <td style={styles.td}><span style={{ color: "#27ae60", fontWeight: 800 }}>${v.total}</span></td>
                  <td style={{ ...styles.td, color: "#aaa", fontSize: 12 }}>{formatFecha(v.saleDate || v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ventas por día */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.dot, background: "#6372ff" }} />
          <span style={styles.sectionTitle}>Ventas de los últimos 7 días</span>
        </div>
        {(() => {
          const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
          const hoy = new Date();
          const data = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(hoy);
            d.setDate(hoy.getDate() - (6 - i));
            const label = dias[d.getDay()];
            const total = ventas
              .filter((v) => {
                const vd = new Date(v.saleDate || v.createdAt);
                return vd.toDateString() === d.toDateString();
              })
              .reduce((sum, v) => sum + v.total, 0);
            return { dia: label, total };
          });
          return (
            <ResponsiveContainer width="100%" height={85}>
              <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6372ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6372ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip
                  formatter={(v) => [`$${v}`, "Ventas"]}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="total" stroke="#6372ff" strokeWidth={2} fill="url(#gradVentas)" dot={{ r: 3, fill: "#6372ff" }} />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

    </div>
  );
};

const styles = {
  cardRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  card: {
    background: "#fff",
    borderRadius: 10,
    padding: "14px 18px",
    flex: 1,
    minWidth: 150,
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1,
    color: "#1a1a2e",
  },
  cardLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
    marginTop: 3,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 300px",
    gap: 12,
  },
  section: {
    background: "#fff",
    borderRadius: 10,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #f0f0f0",
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: "#1a1a2e",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#6372ff",
    display: "inline-block",
    flexShrink: 0,
  },
  th: {
    padding: "8px 10px",
    textAlign: "left",
    fontSize: 11,
    color: "#888",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  td: {
    padding: "8px 10px",
    fontSize: 13,
    verticalAlign: "middle",
    color: "#1a1a2e",
    fontWeight: 600,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  rank: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#f4f6f9",
    color: "#1a1a2e",
    fontWeight: 700,
    fontSize: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  barBg: {
    background: "#f0f0f0",
    borderRadius: 4,
    height: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.4s ease",
  },
};

export default Inicio;
