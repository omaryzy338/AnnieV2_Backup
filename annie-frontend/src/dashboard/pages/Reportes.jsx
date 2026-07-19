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
  const [error,     setError]     = useState("");
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
      } catch {
        setError("Error al cargar los reportes");
      } finally {
        setLoading(false);
      }
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
      const d = new Date(v.saleDate || v.createdAt);
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
    const d = new Date(v.saleDate || v.createdAt);
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  });
  const totalMes   = ventasMes.reduce((a, v) => a + v.total, 0);
  const ticketProm = ventasMes.length > 0 ? totalMes / ventasMes.length : 0;

  // Valor total del inventario
  const valorInventario = productos.reduce((a, p) => a + (p.price * p.quantity), 0);

  // Ganancia neta del mes (solo productos con costo registrado)
  const hayDatosCosto = productos.some((p) => p.cost > 0);
  const gananciaNeta  = ventasMes.reduce((acc, v) => {
    const prod = productos.find((p) => p._id === (v.product?._id || v.product));
    if (prod && prod.cost > 0) acc += v.total - prod.cost * v.quantity;
    return acc;
  }, 0);

  // Mes anterior para comparativo
  const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const ventasMesAnt = ventas.filter((v) => {
    const d = new Date(v.saleDate || v.createdAt);
    return d.getMonth() === mesAnterior.getMonth() && d.getFullYear() === mesAnterior.getFullYear();
  });
  const totalMesAnt   = ventasMesAnt.reduce((a, v) => a + v.total, 0);
  const cambioMes     = totalMesAnt > 0 ? ((totalMes - totalMesAnt) / totalMesAnt * 100).toFixed(1) : null;

  // Ventas por día de la semana
  const ventasPorSemana = (() => {
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const base = dias.map((d) => ({ dia: d, total: 0, ventas: 0 }));
    ventas.forEach((v) => {
      const idx = new Date(v.saleDate || v.createdAt).getDay();
      base[idx].total  += v.total;
      base[idx].ventas += 1;
    });
    return base;
  })();

  // Comparativo mes actual vs anterior por producto (top 5)
  const comparativoProductos = (() => {
    const mapa = {};
    const agregarVentas = (lista, campo) => {
      lista.forEach((v) => {
        const nombre = v.product?.name || "Otro";
        if (!mapa[nombre]) mapa[nombre] = { name: nombre, actual: 0, anterior: 0 };
        mapa[nombre][campo] += v.total;
      });
    };
    agregarVentas(ventasMes,    "actual");
    agregarVentas(ventasMesAnt, "anterior");
    return Object.values(mapa)
      .sort((a, b) => (b.actual + b.anterior) - (a.actual + a.anterior))
      .slice(0, 5)
      .map((x) => ({ ...x, actual: parseFloat(x.actual.toFixed(2)), anterior: parseFloat(x.anterior.toFixed(2)) }));
  })();

  const nombreMes = (d) => d.toLocaleDateString("es-MX", { month: "long" });

  // Top 5 clientes por monto gastado (total historial)
  const topClientes = (() => {
    const mapa = {};
    ventas.forEach((v) => {
      if (!v.client) return;
      const id     = v.client._id || v.client;
      const nombre = `${v.client.name || ""} ${v.client.lastName || ""}`.trim() || "Sin nombre";
      if (!mapa[id]) mapa[id] = { nombre, total: 0, compras: 0 };
      mapa[id].total   += v.total;
      mapa[id].compras += 1;
    });
    return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 5);
  })();

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
      </div>

      {error && (
        <div style={{ background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8, border: "1px solid #ffd0d8", display: "flex", alignItems: "center" }}>
          <i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{error}
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="dash-kpi-grid" style={styles.cardsGrid}>
        <div style={styles.card}>
          <div style={{ ...styles.cardIcon, background: "#f0f2ff" }}>
            <i className="fa fa-money" style={{ color: "#6372ff", fontSize: 22 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.cardValue}>${totalMes.toFixed(2)}</div>
            <div style={styles.cardLabel}>Ventas del mes</div>
            {cambioMes !== null && (
              <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700,
                color: Number(cambioMes) >= 0 ? "#27ae60" : "#e94560" }}>
                {Number(cambioMes) >= 0 ? "▲" : "▼"} {Math.abs(cambioMes)}% vs mes ant.
              </div>
            )}
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
        {hayDatosCosto && (
          <div style={styles.card}>
            <div style={{ ...styles.cardIcon, background: gananciaNeta >= 0 ? "#e8f5e9" : "#fff0f3" }}>
              <i className="fa fa-star" style={{ color: gananciaNeta >= 0 ? "#27ae60" : "#e94560", fontSize: 22 }} />
            </div>
            <div>
              <div style={{ ...styles.cardValue, color: gananciaNeta >= 0 ? "#27ae60" : "#e94560" }}>${gananciaNeta.toFixed(2)}</div>
              <div style={styles.cardLabel}>Ganancia neta del mes</div>
            </div>
          </div>
        )}
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
      <div className="dash-two-col" style={styles.twoCol}>

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

      {/* Comparativo mes actual vs anterior */}
      <div className="dash-two-col" style={styles.twoCol}>
        {/* Barra comparativa por producto */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa fa-bar-chart" style={{ color: "#6372ff" }} />
              <span style={styles.chartTitle}>Comparativo mensual</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#9599b3" }}>
                {nombreMes(mesAnterior)} vs {nombreMes(ahora)}
              </span>
              {cambioMes !== null && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                  background: Number(cambioMes) >= 0 ? "#e8f5e9" : "#fff0f3",
                  color: Number(cambioMes) >= 0 ? "#27ae60" : "#e94560",
                }}>
                  {Number(cambioMes) >= 0 ? "+" : ""}{cambioMes}%
                </span>
              )}
            </div>
          </div>
          {comparativoProductos.length === 0 ? (
            <div style={styles.empty}>
              <i className="fa fa-bar-chart" style={{ fontSize: 28, color: "#e0e0e0", display: "block", marginBottom: 8 }} />
              Sin datos suficientes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparativoProductos} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888" }} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#aaa" }} tickFormatter={(v) => `$${v}`} width={52} />
                <Tooltip formatter={(v, name) => [`$${v}`, name === "actual" ? nombreMes(ahora) : nombreMes(mesAnterior)]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }} />
                <Legend formatter={(v) => v === "actual" ? nombreMes(ahora) : nombreMes(mesAnterior)} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="anterior" fill="#e0e4ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual"   fill="#6372ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ventas por día de la semana */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa fa-calendar" style={{ color: "#f06292" }} />
              <span style={styles.chartTitle}>Ventas por día de la semana</span>
            </div>
            <span style={{ fontSize: 11, color: "#9599b3" }}>Todo el historial</span>
          </div>
          {ventas.length === 0 ? (
            <div style={styles.empty}>
              <i className="fa fa-calendar" style={{ fontSize: 28, color: "#e0e0e0", display: "block", marginBottom: 8 }} />
              Sin ventas todavía
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ventasPorSemana} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f4" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#555" }} />
                <YAxis tick={{ fontSize: 10, fill: "#aaa" }} tickFormatter={(v) => `$${v}`} width={52} />
                <Tooltip formatter={(v, name) => [name === "total" ? `$${v.toFixed(2)}` : v, name === "total" ? "Ingresos" : "Transacciones"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 12 }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {ventasPorSemana.map((entry, i) => {
                    const max = Math.max(...ventasPorSemana.map((d) => d.total));
                    return <Cell key={i} fill={entry.total === max ? "#f06292" : "#f8bbd0"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fila: Top clientes + Últimas ventas */}
      <div className="dash-two-col" style={styles.twoCol}>

        {/* Top clientes */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa fa-users" style={{ color: "#27ae60" }} />
              <span style={styles.chartTitle}>Top clientes</span>
            </div>
            <span style={{ fontSize: 11, color: "#9599b3" }}>Por monto total</span>
          </div>
          {topClientes.length === 0 ? (
            <div style={styles.empty}>
              <i className="fa fa-users" style={{ fontSize: 28, color: "#e0e0e0", display: "block", marginBottom: 8 }} />
              Sin ventas con cliente asignado
            </div>
          ) : (
            topClientes.map((c, i) => {
              const maxT = topClientes[0].total;
              const pct  = Math.round((c.total / maxT) * 100);
              return (
                <div key={i} style={{ marginBottom: i < topClientes.length - 1 ? 12 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: "#9599b3", fontSize: 12, width: 20 }}>#{i + 1}</span>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,#6372ff,#5ca9fb)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 11 }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13 }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: "#9599b3" }}>{c.compras} compra{c.compras !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: "#6372ff", fontSize: 13 }}>${c.total.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 4, background: "#f0f2ff", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4,
                      background: "linear-gradient(to right,#6372ff,#5ca9fb)" }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Últimas ventas */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa fa-history" style={{ color: "#5ca9fb" }} />
              <span style={styles.chartTitle}>Últimas ventas</span>
            </div>
            <span style={{ fontSize: 11, color: "#9599b3" }}>Las 8 más recientes</span>
          </div>
          {ventas.length === 0 ? (
            <div style={styles.empty}>
              <i className="fa fa-shopping-cart" style={{ fontSize: 28, color: "#e0e0e0", display: "block", marginBottom: 8 }} />
              Sin ventas todavía
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9ff" }}>
                  {["Producto", "Cliente", "Total", "Fecha"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: 10, color: "#9599b3", fontWeight: 700,
                      textTransform: "uppercase", textAlign: "left", borderBottom: "1.5px solid #f0f0f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...ventas].sort((a, b) => new Date(b.saleDate || b.createdAt) - new Date(a.saleDate || a.createdAt)).slice(0, 8).map((v) => (
                  <tr key={v._id} style={{ borderBottom: "1px solid #f4f4f4" }}>
                    <td style={{ padding: "9px 12px", fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>{v.product?.name || "—"}</td>
                    <td style={{ padding: "9px 12px", fontSize: 12, color: "#1a1a2e" }}>{v.client ? `${v.client.name || ""} ${v.client.lastName || ""}`.trim() : <span style={{ color: "#ccc" }}>Sin cliente</span>}</td>
                    <td style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, color: "#6372ff" }}>${v.total.toFixed(2)}</td>
                    <td style={{ padding: "9px 12px", fontSize: 11, color: "#9599b3" }}>
                      {new Date(v.saleDate || v.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  cardsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14,
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
};

export default Reportes;
