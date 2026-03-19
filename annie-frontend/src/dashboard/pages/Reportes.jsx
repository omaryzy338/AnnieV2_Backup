import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORES = ["#6372ff", "#5ca9fb", "#f06292", "#81c784", "#ffb74d", "#4dd0e1", "#ce93d8", "#a1887f"];

const Reportes = () => {
  const [ventas,    setVentas]    = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes,  setClientes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [periodo,   setPeriodo]   = useState(30); // días a mostrar en el gráfico de línea

  useEffect(() => {
    const cargar = async () => {
      try {
        const [rv, rp, rc] = await Promise.all([
          axios.get("/sales"),
          axios.get("/products"),
          axios.get("/clients"),
        ]);
        setVentas(rv.data);
        setProductos(rp.data);
        setClientes(rc.data);
      } catch {}
      finally { setLoading(false); }
    };
    cargar();
  }, []);

  // ── Procesamiento de datos ────────────────────────────────────────

  // Ventas agrupadas por día (período seleccionado)
  const ventasPorDia = (() => {
    const hoy = new Date();
    const mapa = {};
    for (let i = periodo - 1; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      mapa[key] = { dia: key, total: 0, transacciones: 0 };
    }
    ventas.forEach((v) => {
      const d = new Date(v.createdAt);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      if (mapa[key]) {
        mapa[key].total += v.total;
        mapa[key].transacciones += 1;
      }
    });
    return Object.values(mapa);
  })();

  // Top 6 productos más vendidos (por cantidad)
  const topProductos = (() => {
    const mapa = {};
    ventas.forEach((v) => {
      const nombre = v.product?.name || "Desconocido";
      mapa[nombre] = (mapa[nombre] || 0) + v.quantity;
    });
    return Object.entries(mapa)
      .map(([name, vendidos]) => ({ name, vendidos }))
      .sort((a, b) => b.vendidos - a.vendidos)
      .slice(0, 6);
  })();

  // Ventas por categoría (agrupadas por $)
  const ventasPorCat = (() => {
    const mapa = {};
    ventas.forEach((v) => {
      const prod = productos.find((p) => p._id === (v.product?._id || v.product));
      const cat = prod?.category || "Sin categoría";
      mapa[cat] = (mapa[cat] || 0) + v.total;
    });
    return Object.entries(mapa)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  })();

  // ── Resumen del mes actual ─────────────────────────────────────────
  const ahora = new Date();
  const ventasMes = ventas.filter((v) => {
    const d = new Date(v.createdAt);
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  });
  const totalMes   = ventasMes.reduce((a, v) => a + v.total, 0);
  const ticketProm = ventasMes.length > 0 ? totalMes / ventasMes.length : 0;

  // Producto estrella del mes
  const productoEstrella = (() => {
    const mapa = {};
    ventasMes.forEach((v) => {
      const nombre = v.product?.name || "?";
      mapa[nombre] = (mapa[nombre] || 0) + v.quantity;
    });
    const top = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
    return top[0]?.[0] || "—";
  })();

  // Valor total del inventario
  const valorInventario = productos.reduce((a, p) => a + (p.price * p.quantity), 0);

  // Exportar ventas a CSV
  const exportarCSV = () => {
    const headers = ["Fecha", "Producto", "Cantidad", "Precio Unit.", "Descuento%", "Total"];
    const rows = ventas.map((v) => [
      new Date(v.createdAt).toLocaleDateString("es-MX"),
      `"${v.product?.name || ""}"`,
      v.quantity, v.price, v.discount || 0, v.total,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ventas.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 30 }}>Cargando reportes...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h4 style={{ margin: 0, color: "#1a1a2e" }}>
            <i className="fa fa-bar-chart" style={{ color: "#6372ff", marginRight: 10 }} />
            Reportes y Estadísticas
          </h4>
          <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 13 }}>
            Análisis de ventas, inventario y clientes
          </p>
        </div>
        <button onClick={exportarCSV} style={styles.btnExport}>
          <i className="fa fa-download" style={{ marginRight: 7 }} />Exportar ventas CSV
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: "#f0f2ff" }}>
            <i className="fa fa-money" style={{ color: "#6372ff", fontSize: 22 }} />
          </div>
          <div>
            <div style={styles.cardValue}>${totalMes.toFixed(2)}</div>
            <div style={styles.cardLabel}>Ventas del mes</div>
          </div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: "#e8f5e9" }}>
            <i className="fa fa-shopping-cart" style={{ color: "#27ae60", fontSize: 22 }} />
          </div>
          <div>
            <div style={styles.cardValue}>{ventasMes.length}</div>
            <div style={styles.cardLabel}>Transacciones del mes</div>
          </div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: "#fff3e0" }}>
            <i className="fa fa-line-chart" style={{ color: "#ff9800", fontSize: 22 }} />
          </div>
          <div>
            <div style={styles.cardValue}>${ticketProm.toFixed(2)}</div>
            <div style={styles.cardLabel}>Ticket promedio</div>
          </div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: "#e0f2f1" }}>
            <i className="fa fa-cubes" style={{ color: "#00897b", fontSize: 22 }} />
          </div>
          <div>
            <div style={styles.cardValue}>${valorInventario.toFixed(2)}</div>
            <div style={styles.cardLabel}>Valor del inventario</div>
          </div>
        </div>
      </div>

      {/* Gráfica de ventas por día */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa fa-area-chart" style={{ color: "#6372ff" }} />
            <span style={styles.chartTitle}>Ventas por día</span>
          </div>
          {/* Selector de período */}
          <div style={{ display: "flex", gap: 6 }}>
            {[7, 15, 30].map((d) => (
              <button key={d} onClick={() => setPeriodo(d)}
                style={{
                  padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: periodo === d ? "none" : "1.5px solid #e0e0e0",
                  background: periodo === d ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#f4f4f4",
                  color: periodo === d ? "#fff" : "#666",
                }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        {ventasPorDia.every((d) => d.total === 0) ? (
          <div style={styles.empty}>
            <i className="fa fa-bar-chart" style={{ fontSize: 32, color: "#e0e0e0", display: "block", marginBottom: 8 }} />
            Sin ventas en este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ventasPorDia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6372ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6372ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#aaa" }} />
              <YAxis tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={(v) => `$${v}`} width={58} />
              <Tooltip
                formatter={(v, name) => name === "total" ? [`$${v.toFixed(2)}`, "Total"] : [v, "Ventas"]}
                contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="total" stroke="#6372ff" strokeWidth={2.5}
                fill="url(#gradVentas)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fila: Top productos + Ventas por categoría */}
      <div style={styles.twoCol}>

        {/* Bar: top productos */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <i className="fa fa-trophy" style={{ color: "#ffb74d", marginRight: 8 }} />
            <span style={styles.chartTitle}>Top productos más vendidos</span>
          </div>
          {topProductos.length === 0 ? (
            <div style={styles.empty}>
              <i className="fa fa-cube" style={{ fontSize: 32, color: "#e0e0e0", display: "block", marginBottom: 8 }} />
              Sin datos todavía
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={topProductos} layout="vertical"
                margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#aaa" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#555" }} width={90} />
                <Tooltip formatter={(v) => [v, "Unidades vendidas"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }} />
                <Bar dataKey="vendidos" radius={[0, 6, 6, 0]}>
                  {topProductos.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie: ventas por categoría */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <i className="fa fa-pie-chart" style={{ color: "#f06292", marginRight: 8 }} />
            <span style={styles.chartTitle}>Ventas por categoría</span>
          </div>
          {ventasPorCat.length === 0 ? (
            <div style={styles.empty}>
              <i className="fa fa-pie-chart" style={{ fontSize: 32, color: "#e0e0e0", display: "block", marginBottom: 8 }} />
              Sin datos todavía
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={ventasPorCat} dataKey="value" nameKey="name"
                  cx="50%" cy="48%" outerRadius={82} innerRadius={42} paddingAngle={3}>
                  {ventasPorCat.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, "Total"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={9}
                  formatter={(v) => <span style={{ fontSize: 11, color: "#555" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fila inferior: stats globales */}
      <div style={styles.statsRow}>
        {[
          { icon: "fa-cube",              color: "#6372ff", bg: "#f0f2ff", num: productos.length,                                  label: "Productos registrados"   },
          { icon: "fa-users",             color: "#27ae60", bg: "#e8f5e9", num: clientes.length,                                   label: "Clientes registrados"    },
          { icon: "fa-shopping-cart",     color: "#ff9800", bg: "#fff3e0", num: ventas.length,                                     label: "Ventas totales"          },
          { icon: "fa-exclamation-triangle", color: "#e74c3c", bg: "#fff0f3", num: productos.filter((p) => p.quantity < 5).length, label: "Stock bajo (< 5 uds)"    },
        ].map(({ icon, color, bg, num, label }) => (
          <div key={label} style={styles.statBox}>
            <div style={{ ...styles.statIcon, background: bg }}>
              <i className={`fa ${icon}`} style={{ color, fontSize: 18 }} />
            </div>
            <div style={{ ...styles.statNum, color }}>{num}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Nota si product estrella */}
      {productoEstrella !== "—" && (
        <div style={styles.estrella}>
          <i className="fa fa-star" style={{ color: "#ffb74d", marginRight: 8, fontSize: 16 }} />
          <span>Producto estrella del mes: <strong>{productoEstrella}</strong></span>
        </div>
      )}
    </div>
  );
};

const styles = {
  btnExport: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13,
    display: "inline-flex", alignItems: "center", flexShrink: 0,
  },
  cardsGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14,
  },
  card: {
    background: "#fff", borderRadius: 12, padding: "18px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 14,
  },
  cardIcon: {
    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cardValue: { fontSize: 22, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.1 },
  cardLabel: { fontSize: 12, color: "#9599b3", marginTop: 3, fontWeight: 500 },
  chartCard: {
    background: "#fff", borderRadius: 12, padding: "20px 20px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  chartHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: 700, color: "#1a1a2e" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  empty: {
    textAlign: "center", color: "#ccc", fontSize: 13,
    padding: "40px 0", lineHeight: 2,
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14,
  },
  statBox: {
    background: "#fff", borderRadius: 12, padding: "20px 16px", textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 12, margin: "0 auto 10px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  statNum:   { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: "#9599b3", marginTop: 6 },
  estrella: {
    background: "linear-gradient(to right, #fffde7, #fff9e3)",
    border: "1.5px solid #ffe082", borderRadius: 10, padding: "12px 18px",
    fontSize: 14, color: "#7a5f00", display: "flex", alignItems: "center",
  },
};

export default Reportes;
