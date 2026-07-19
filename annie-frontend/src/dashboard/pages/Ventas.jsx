import React, { useEffect, useState, useRef } from "react";
import axios from "../../api/axiosConfig";
import useWindowWidth from "../../hooks/useWindowWidth";
import { resolveMediaUrl } from "../../utils/media";

const formInicial = { productId: "", clientId: "", quantity: 1, discount: 0, discountType: "porcentaje", saleDate: new Date().toISOString().split("T")[0] };

const Ventas = () => {
  const [ventas, setVentas]           = useState([]);
  const [productos, setProductos]     = useState([]);
  const [clientes, setClientes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [confirmId, setConfirmId]     = useState(null);
  const [busqueda, setBusqueda]       = useState("");
  const [periodo, setPeriodo]         = useState("mes");
  const [hoveredRow, setHoveredRow]   = useState(null);
  const [form, setForm]               = useState(formInicial);
  const ww = useWindowWidth();
  const isMobile = ww < 768;
  const [productoSel, setProductoSel] = useState(null);
  const [negocio, setNegocio]         = useState(null);
  const successTimer                  = useRef(null);

  const cargar = async () => {
    try {
      const [v, p, c, perfil] = await Promise.all([
        axios.get("/sales"),
        axios.get("/products"),
        axios.get("/clients"),
        axios.get("/profile"),
      ]);
      setVentas(v.data);
      setProductos(p.data);
      setClientes(c.data);
      setNegocio(perfil.data.business);
    } catch { setError("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg) => {
    setSuccess(msg);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(""), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "productId") {
      const p = productos.find((x) => x._id === value) || null;
      setProductoSel(p);
      // Pre-llenar descuento del producto
      if (p) setForm((prev) => ({ ...prev, productId: value, discount: p.discount || 0, discountType: "porcentaje" }));
      else    setForm((prev) => ({ ...prev, productId: value, discount: 0 }));
    }
  };

  const calcTotal = () => {
    if (!productoSel || !form.quantity) return "0.00";
    const qty  = Number(form.quantity);
    const desc = Number(form.discount) || 0;
    const base = productoSel.price * qty;
    if (form.discountType === "fijo") return Math.max(0, base - desc).toFixed(2);
    return Math.max(0, base - base * desc / 100).toFixed(2);
  };

  const calcGanancia = () => {
    if (!productoSel || !form.quantity) return null;
    if (!productoSel.cost || productoSel.cost <= 0) return null;
    const qty        = Number(form.quantity);
    const totalVenta = parseFloat(calcTotal());
    const costoTotal = productoSel.cost * qty;
    const ganancia   = totalVenta - costoTotal;
    const pct        = totalVenta > 0 ? (ganancia / totalVenta * 100) : 0;
    return { ganancia: ganancia.toFixed(2), pct: pct.toFixed(1), costoTotal: costoTotal.toFixed(2) };
  };

  const calcDescPct = () => {
    if (form.discountType !== "fijo" || !productoSel || !form.quantity) return null;
    const base = productoSel.price * Number(form.quantity);
    if (base <= 0) return null;
    return (Number(form.discount) / base * 100).toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("/sales", {
        productId:    form.productId,
        clientId:     form.clientId || undefined,
        quantity:     Number(form.quantity),
        discount:     Number(form.discount) || 0,
        discountType: form.discountType,
        saleDate:     form.saleDate || undefined,
      });
      mostrarExito("Venta registrada correctamente");
      setForm(formInicial);
      setProductoSel(null);
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar venta");
    }
  };

  const handleEliminar = async (id) => {
    try {
      await axios.delete(`/sales/${id}`);
      mostrarExito("Venta eliminada");
      setConfirmId(null);
      cargar();
    } catch {
      setError("Error al eliminar la venta");
      setConfirmId(null);
    }
  };

  // Filtrado
  const ahora = new Date();
  const ventasFiltradas = ventas
    .filter((v) => {
      if (!busqueda) return true;
      return (v.product?.name || "").toLowerCase().includes(busqueda.toLowerCase()) ||
             (v.client?.name  || "").toLowerCase().includes(busqueda.toLowerCase());
    })
    .filter((v) => {
      const f = new Date(v.saleDate || v.createdAt);
      if (periodo === "hoy")    return f.toDateString() === ahora.toDateString();
      if (periodo === "semana") { const h = new Date(ahora); h.setDate(ahora.getDate() - 7); return f >= h; }
      if (periodo === "mes")    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
      return true;
    });

  // KPIs
  const ventasHoy = ventas.filter((v) => new Date(v.saleDate || v.createdAt).toDateString() === ahora.toDateString());
  const ventasMes = ventas.filter((v) => {
    const f = new Date(v.saleDate || v.createdAt);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  });
  const totalMes       = ventasMes.reduce((a, v) => a + v.total, 0);
  const ticketPromedio = ventasMes.length ? (totalMes / ventasMes.length).toFixed(2) : "0.00";
  const clientesUnicos = new Set(ventasMes.filter((v) => v.client).map((v) => v.client._id)).size;

  // Muestra la fecha de la venta respetando el día UTC (sin desfase de zona horaria)
  const formatFecha = (iso) => {
    const d = new Date(iso);
    // Si tiene hora guardada (saleDate guardado a T12:00), mostrar solo fecha
    // Usamos UTC para evitar que medianoche UTC => día anterior en MX
    const day   = d.getUTCDate().toString().padStart(2, "0");
    const month = d.toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" });
    const year  = d.getUTCFullYear();
    const hour  = d.getUTCHours();
    // Si fue guardado como saleDate (T12:00 = mediodía UTC), solo mostrar fecha
    if (hour >= 11 && hour <= 13) return `${day} ${month} ${year}`;
    // Si es createdAt o un saleDate antiguo (T00:00), mostrar fecha con hora local
    return new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Genera un recibo/orden de venta imprimible (el usuario puede "Guardar
  // como PDF" desde el diálogo de impresión del navegador)
  const imprimirRecibo = (v) => {
    const nombreNegocio = negocio?.name || "Mi negocio";
    const clienteTxt = v.client ? `${v.client.name} ${v.client.lastName || ""}`.trim() : "Cliente general";
    const descTxt = v.discount > 0
      ? (v.discountType === "fijo" ? `-$${v.discount}` : `-${v.discount}%`)
      : "—";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo - ${nombreNegocio}</title>
<style>
  body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1a1a2e; padding: 32px; max-width: 480px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #888; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888; padding: 6px 4px; border-bottom: 2px solid #eee; }
  td { padding: 8px 4px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
  .total-row td { font-weight: 800; font-size: 16px; color: #27ae60; border-top: 2px solid #1a1a2e; border-bottom: none; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 4px; }
  .footer { margin-top: 30px; text-align: center; color: #aaa; font-size: 11px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${nombreNegocio}</h1>
  <div class="sub">Recibo de venta ${negocio?.rfc && !negocio?.rfcGenerico ? `· RFC: ${negocio.rfc}` : ""}</div>
  <div class="meta"><span>Fecha</span><strong>${formatFecha(v.saleDate || v.createdAt)}</strong></div>
  <div class="meta"><span>Cliente</span><strong>${clienteTxt}</strong></div>
  <table>
    <thead>
      <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Desc.</th><th>Importe</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${v.product?.name || "—"}</td>
        <td>${v.quantity}</td>
        <td>$${v.price}</td>
        <td>${descTxt}</td>
        <td>$${v.total}</td>
      </tr>
      <tr class="total-row">
        <td colspan="4">Total</td>
        <td>$${v.total}</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">Gracias por su compra · Generado con Annie</div>
</body>
</html>`;

    const ventana = window.open("", "_blank", "width=520,height=700");
    if (!ventana) { setError("Habilita las ventanas emergentes para ver el recibo"); return; }
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 300);
  };

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Modal confirmar eliminar */}
      {confirmId && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <i className="fa fa-trash" style={{ color: "#e05555", fontSize: 24 }} />
            </div>
            <h5 style={{ margin: "0 0 6px", color: "#1a1a2e", fontSize: 16 }}>Eliminar venta?</h5>
            <p style={{ margin: "0 0 20px", color: "#888", fontSize: 13 }}>Esta accion no se puede deshacer.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={styles.btnModalCancel} onClick={() => setConfirmId(null)}>Cancelar</button>
              <button style={styles.btnModalDelete} onClick={() => handleEliminar(confirmId)}>
                <i className="fa fa-trash" style={{ marginRight: 7 }} />Si, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, color: "#1a1a2e", fontSize: isMobile ? 16 : 18 }}>
            <i className="fa fa-shopping-cart" style={{ color: "#6372ff", marginRight: 10 }} />
            Ventas
          </h4>
          <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 13 }}>
            {ventas.length} venta{ventas.length !== 1 ? "s" : ""} registradas
          </p>
        </div>
        {showForm ? (
          <button style={styles.btnCancel} onClick={() => {
            setShowForm(false); setForm(formInicial); setProductoSel(null);
          }}>
            <i className="fa fa-times" style={{ marginRight: 8 }} />Cancelar
          </button>
        ) : (
          <button style={styles.btnPrimary} onClick={() => { setShowForm(true); setError(""); }}>
            <i className="fa fa-plus" style={{ marginRight: 8 }} />Registrar venta
          </button>
        )}
      </div>

      {error   && <div style={styles.alertError}><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{error}</div>}
      {success && <div style={styles.alertSuccess}><i className="fa fa-check-circle" style={{ marginRight: 8 }} />{success}</div>}

      {/* KPI cards */}
      <div className="dash-kpi-grid" style={styles.kpiGrid}>
        {[
          { icon: "fa-bolt",       bg: "#e8f5e9", color: "#6372ff", val: `$${ventasHoy.reduce((a,v) => a + v.total, 0).toFixed(2)}`, label: "Ventas hoy"         },
          { icon: "fa-calendar",   bg: "#f0f2ff", color: "#6372ff", val: `$${totalMes.toFixed(2)}`,                                   label: "Total este mes"     },
          { icon: "fa-line-chart", bg: "#fff8e1", color: "#f9a825", val: `$${ticketPromedio}`,                                        label: "Ticket promedio"    },
          { icon: "fa-users",      bg: "#fce4ec", color: "#e91e63", val: clientesUnicos,                                              label: "Clientes este mes"  },
        ].map(({ icon, bg, color, val, label }) => (
          <div key={label} style={styles.kpiCard}>
            <div style={{ ...styles.kpiIcon, background: bg }}>
              <i className={`fa ${icon}`} style={{ color, fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.1 }}>{val}</div>
              <div style={{ fontSize: 11, color: "#9599b3", marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario nueva venta */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <i className="fa fa-shopping-cart" style={{ color: "#6372ff", fontSize: 18 }} />
            <h5 style={{ margin: 0, color: "#1a1a2e" }}>Nueva venta</h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="dash-form-grid" style={styles.formGrid}>

              {/* Producto (ancho completo) */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-cube" style={styles.labelIcon} />Producto *
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {productos.map((p) => {
                    const sel = form.productId === p._id;
                    const sinStock = p.quantity < 1;
                    return (
                      <button key={p._id} type="button"
                        disabled={sinStock}
                        onClick={() => {
                          setProductoSel(p);
                          setForm((prev) => ({
                            ...prev,
                            productId: p._id,
                            discount: p.discount || 0,
                            discountType: "porcentaje",
                          }));
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "6px 14px 6px 6px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: sinStock ? "not-allowed" : "pointer", transition: "all 0.15s",
                          opacity: sinStock ? 0.45 : 1,
                          background: sel ? "#f0f2ff" : "#fff",
                          color: sel ? "#6372ff" : "#555",
                          border: sel ? "1.5px solid #6372ff" : "1.5px solid #e0e0e0",
                        }}>
                        {/* Thumbnail */}
                        {p.image ? (
                          <img
                            src={resolveMediaUrl(p.image)}
                            alt=""
                            style={{ width: 26, height: 26, objectFit: "cover", borderRadius: 6,
                              border: sel ? "1.5px solid #6372ff" : "1.5px solid #e0e0e0", flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                            background: sel ? "linear-gradient(135deg,#6372ff,#5ca9fb)" : "#e8eaff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <i className="fa fa-cube" style={{ color: sel ? "#fff" : "#9599b3", fontSize: 11 }} />
                          </div>
                        )}
                        <span>{p.name}{p.brand ? ` · ${p.brand}` : ""}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, marginLeft: 2,
                          color: sel ? "#6372ff" : "#1a1a2e",
                        }}>${p.price}</span>
                        {sinStock && (
                          <span style={{ fontSize: 10, color: "#e74c3c", fontWeight: 700 }}>sin stock</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Preview producto seleccionado */}
                {productoSel && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14,
                    background: "#f8f9ff", border: "1.5px solid #e8eaff", borderRadius: 10, padding: "10px 14px" }}>
                    {productoSel.image ? (
                      <img
                        src={resolveMediaUrl(productoSel.image)}
                        alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1.5px solid #e8eaff" }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: "#e8eaff",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="fa fa-cube" style={{ color: "#6372ff", fontSize: 20 }} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{productoSel.name}</div>
                      {productoSel.brand && <div style={{ fontSize: 12, color: "#6372ff", fontWeight: 600 }}>{productoSel.brand}</div>}
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        Stock disponible:{" "}
                        <strong style={{ color: productoSel.quantity < 5 ? "#e74c3c" : "#27ae60" }}>{productoSel.quantity}</strong>
                        {" · "}
                        Precio: <strong>${productoSel.price}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cliente */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-users" style={styles.labelIcon} />Cliente (opcional)
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {/* Sin cliente */}
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, clientId: "" }))}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                      background: !form.clientId ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                      color: !form.clientId ? "#fff" : "#666",
                      border: !form.clientId ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                    }}>
                    <i className="fa fa-user-times" style={{ fontSize: 12 }} />
                    Sin cliente
                  </button>
                  {clientes.map((c) => {
                    const sel = form.clientId === c._id;
                    const ini = ((c.name || "?").charAt(0) + (c.lastName || "").charAt(0)).toUpperCase();
                    return (
                      <button key={c._id} type="button"
                        onClick={() => setForm((p) => ({ ...p, clientId: c._id }))}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "6px 14px 6px 6px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.15s",
                          background: sel ? "#f0f2ff" : "#fff",
                          color: sel ? "#6372ff" : "#555",
                          border: sel ? "1.5px solid #6372ff" : "1.5px solid #e0e0e0",
                        }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: sel
                            ? "linear-gradient(135deg,#6372ff,#5ca9fb)"
                            : "linear-gradient(135deg,#d0d4ff,#b8d8ff)",
                          color: "#fff", fontWeight: 700, fontSize: 10,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>{ini}</div>
                        {c.name} {c.lastName || ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cantidad */}
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-hashtag" style={styles.labelIcon} />Cantidad *
                </label>
                <input style={styles.input} name="quantity" type="number" min="1"
                  max={productoSel?.quantity || undefined}
                  value={form.quantity} onChange={handleChange} required />
              </div>

              {/* Fecha de la venta */}
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-calendar" style={styles.labelIcon} />Fecha de la venta
                </label>
                <input style={styles.input} name="saleDate" type="date"
                  value={form.saleDate} onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]} />
              </div>

              {/* Descuento (ancho completo) */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-tag" style={styles.labelIcon} />Descuento en esta venta
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Toggle tipo */}
                  {[
                    { v: "porcentaje", l: "% Porcentaje" },
                    { v: "fijo",       l: "$ Monto fijo" },
                  ].map(({ v, l }) => (
                    <button key={v} type="button"
                      onClick={() => setForm((p) => ({ ...p, discountType: v, discount: 0 }))}
                      style={{
                        padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", lineHeight: 1, minWidth: 120,
                        border: form.discountType === v ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                        background: form.discountType === v ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                        color: form.discountType === v ? "#fff" : "#666",
                      }}>
                      {l}
                    </button>
                  ))}
                  {/* Input valor */}
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e8eaff",
                    borderRadius: 8, overflow: "hidden", background: "#fafbff" }}>
                    <span style={{ padding: "9px 10px", background: "#f0f2ff", color: "#6372ff",
                      fontSize: 13, fontWeight: 700, borderRight: "1px solid #e8eaff" }}>
                      {form.discountType === "porcentaje" ? "%" : "$"}
                    </span>
                    <input
                      style={{ border: "none", outline: "none", padding: "9px 12px",
                        fontSize: 13, color: "#1a1a2e", background: "transparent", width: 80 }}
                      name="discount" type="number" min="0"
                      max={form.discountType === "porcentaje" ? 100 : undefined}
                      step="0.01"
                      value={form.discount} onChange={handleChange} />
                  </div>
                  {Number(form.discount) > 0 && (
                    <span style={{ fontSize: 12, color: "#27ae60", fontWeight: 700 }}>
                      <i className="fa fa-check-circle" style={{ marginRight: 4 }} />
                      Descuento aplicado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen */}
            {productoSel && (
              <div style={styles.resumen}>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#9599b3", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Precio unit.</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>${productoSel.price}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#9599b3", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Cantidad</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{form.quantity}</div>
                  </div>
                  {Number(form.discount) > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "#9599b3", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Descuento</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#e05555" }}>
                        {form.discountType === "porcentaje" ? `${form.discount}%` : `$${form.discount}`}
                      </div>
                      {calcDescPct() && (
                        <div style={{ fontSize: 11, color: "#e05555", fontWeight: 600, marginTop: 2 }}>≈ {calcDescPct()}% del total</div>
                      )}
                    </div>
                  )}
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#9599b3", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Total</div>
                    <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#27ae60" }}>${calcTotal()}</div>
                  </div>
                </div>

                {/* Ganancia neta */}
                {(() => {
                  const g = calcGanancia();
                  const sinCosto = !productoSel.cost || productoSel.cost <= 0;
                  return (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #e8eaff",
                      display: "flex", gap: 28, flexWrap: "wrap", alignItems: "baseline" }}>
                      {sinCosto ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff8e1",
                          border: "1.5px solid #ffe082", borderRadius: 8, padding: "8px 14px", flex: 1 }}>
                          <i className="fa fa-info-circle" style={{ color: "#f9a825", fontSize: 14 }} />
                          <span style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                            Sin precio de costo. Agrégalo en <strong>Productos → Editar</strong> para ver la ganancia.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div style={{ fontSize: 11, color: "#1a1a2e", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Ganancia neta</div>
                            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: Number(g.ganancia) >= 0 ? "#27ae60" : "#e94560", lineHeight: 1.1 }}>${g.ganancia}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#1a1a2e", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Margen</div>
                            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: Number(g.ganancia) >= 0 ? "#27ae60" : "#e94560" }}>{g.pct}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#1a1a2e", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Costo total</div>
                            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: "#1a1a2e" }}>${g.costoTotal}</div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="submit" style={styles.btnSuccess}>
                <i className="fa fa-check" style={{ marginRight: 8 }} />Confirmar venta
              </button>
              <button type="button" style={styles.btnCancel}
                onClick={() => { setShowForm(false); setForm(formInicial); setProductoSel(null); }}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra busqueda + periodo */}
      {ventas.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ ...styles.searchBox, width: isMobile ? "100%" : 320 }}>
            <i className="fa fa-search" style={styles.searchIcon} />
            <input style={styles.searchInput} placeholder="Buscar por producto o cliente..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={styles.searchClear}>
                <i className="fa fa-times" />
              </button>
            )}
          </div>

          {/* Filtros periodo */}
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { v: "hoy",    l: "Hoy"      },
              { v: "semana", l: "7 dias"   },
              { v: "mes",    l: "Este mes" },
              { v: "todo",   l: "Todo"     },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setPeriodo(v)}
                style={{
                  padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  background: periodo === v ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                  color: periodo === v ? "#fff" : "#666",
                  border: periodo === v ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                }}>{l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contador */}
      {ventas.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>
            {ventasFiltradas.length} de {ventas.length} ventas
          </span>
        </div>
      )}

      {/* Tabla / Empty state */}
      {ventas.length === 0 ? (
        <div style={styles.empty}>
          <i className="fa fa-shopping-cart" style={{ fontSize: 40, color: "#d0d4ff", display: "block", marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: "#555", marginBottom: 4 }}>Sin ventas todavia</div>
          <div style={{ color: "#aaa", fontSize: 13 }}>Registra tu primera venta con el boton de arriba</div>
        </div>
      ) : isMobile ? (
        /* Vista cards en móvil */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ventasFiltradas.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 13, background: "#fff", borderRadius: 12 }}>
              Sin resultados para este periodo
            </div>
          ) : ventasFiltradas.map((v) => (
            <div key={v._id} style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1.5px solid #f0f2ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {v.product?.image ? (
                  <img src={resolveMediaUrl(v.product.image)}
                    alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: "1.5px solid #e8eaff", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f0f2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className="fa fa-cube" style={{ color: "#c8ccff", fontSize: 16 }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{v.product?.name || "-"}</div>
                  <div style={{ fontSize: 11, color: "#9599b3" }}>{formatFecha(v.saleDate || v.createdAt)}</div>
                </div>
                <span style={{ color: "#27ae60", fontSize: 18, fontWeight: 800 }}>${v.total}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {v.client && (
                  <span style={{ fontSize: 12, color: "#555", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <i className="fa fa-user" style={{ color: "#6372ff", fontSize: 10 }} />
                    {v.client.name} {v.client.lastName || ""}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#888" }}>×{v.quantity} · ${v.price}</span>
                {v.discount > 0 && (
                  <span style={{ background: "#fff0f3", color: "#e05555", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>
                    {v.discountType === "fijo" ? `$${v.discount}` : `${v.discount}%`}
                  </span>
                )}
                <button style={{ ...styles.btnGhost, marginLeft: "auto", padding: "4px 10px" }} onClick={() => imprimirRecibo(v)}>
                  <i className="fa fa-file-text-o" style={{ fontSize: 11 }} />
                </button>
                <button style={{ ...styles.btnDelete, padding: "4px 10px" }} onClick={() => setConfirmId(v._id)}>
                  <i className="fa fa-trash" style={{ fontSize: 11 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dash-table-wrap" style={styles.tableCard}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9ff" }}>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Cant.</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Descuento</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Accion</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                    Sin resultados para este periodo
                  </td>
                </tr>
              ) : ventasFiltradas.map((v) => (
                <tr key={v._id}
                  onMouseEnter={() => setHoveredRow(v._id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: "1px solid #f0f0f0",
                    background: hoveredRow === v._id ? "#f8f9ff" : "transparent",
                    transition: "background 0.12s" }}>
                  <td style={{ ...styles.td, color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatFecha(v.saleDate || v.createdAt)}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {v.product?.image ? (
                        <img
                          src={resolveMediaUrl(v.product.image)}
                          alt="" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 8,
                            border: "1.5px solid #e8eaff", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f0f2ff",
                          border: "1.5px solid #e8eaff", display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0 }}>
                          <i className="fa fa-cube" style={{ color: "#c8ccff", fontSize: 16 }} />
                        </div>
                      )}
                      <div>
                        <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{v.product?.name || "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {v.client ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "linear-gradient(135deg, #6372ff, #5ca9fb)",
                          color: "#fff", fontWeight: 700, fontSize: 11,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {((v.client.name || "?").charAt(0) + (v.client.lastName || "").charAt(0)).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>
                          {v.client.name} {v.client.lastName || ""}
                        </span>
                      </div>
                    ) : <span style={{ color: "#ccc", fontSize: 12 }}>--</span>}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center", fontWeight: 700, color: "#1a1a2e" }}>{v.quantity}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#1a1a2e" }}>${v.price}</td>
                  <td style={styles.td}>
                    {v.discount > 0
                      ? <span style={{ background: "#fff0f3", color: "#e05555", borderRadius: 6,
                          padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>
                          {v.discountType === "fijo" ? `$${v.discount}` : `${v.discount}%`}
                        </span>
                      : <span style={{ color: "#ccc" }}>-</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: "#27ae60", fontSize: 15, fontWeight: 800 }}>${v.total}</span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.btnGhost} onClick={() => imprimirRecibo(v)}>
                      <i className="fa fa-file-text-o" style={{ marginRight: 5 }} />Recibo
                    </button>
                    <button style={styles.btnDelete} onClick={() => setConfirmId(v._id)}>
                      <i className="fa fa-trash" style={{ marginRight: 5 }} />Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  btnPrimary: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "flex", alignItems: "center",
  },
  btnSuccess: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "flex", alignItems: "center",
  },
  btnCancel: {
    background: "#fff", color: "#e05555", border: "1.5px solid #ffd0d8",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  btnDelete: {
    background: "#fff0f3", color: "#e05555", border: "1px solid #ffd0d8",
    borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, display: "inline-flex", alignItems: "center",
  },
  btnGhost: {
    background: "#f4f6ff", color: "#6372ff", border: "1px solid #c8ccff",
    borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, marginRight: 6, display: "inline-flex", alignItems: "center",
  },
  btnModalCancel: {
    background: "#f4f6ff", color: "#555", border: "1.5px solid #e0e0e0",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnModalDelete: {
    background: "linear-gradient(135deg,#e05555,#ff7675)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  kpiCard: {
    background: "#fff", borderRadius: 12, padding: "14px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12,
  },
  kpiIcon: {
    width: 44, height: 44, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  formCard: {
    background: "#fff", borderRadius: 12, padding: 24,
    boxShadow: "0 2px 16px rgba(99,114,255,0.1)", border: "1.5px solid #e8eaff",
  },
  formHeader: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
    paddingBottom: 14, borderBottom: "1px solid #f0f0f0",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  fieldWrap: { display: "flex", flexDirection: "column" },
  label: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  labelIcon: { fontSize: 11, color: "#9599b3" },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8",
    fontSize: 14, color: "#1a1a2e", fontWeight: 600, outline: "none",
    boxSizing: "border-box", background: "#fafafa", transition: "border-color 0.2s",
  },
  resumen: {
    background: "linear-gradient(135deg, #f8f9ff, #eef0ff)",
    border: "1.5px solid #e0e3ff", borderRadius: 10, padding: "16px 20px", marginTop: 14,
  },
  tableCard: {
    background: "#fff", borderRadius: 12, overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  th: {
    padding: "12px 16px", fontSize: 11, color: "#9599b3",
    fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
    textAlign: "left", borderBottom: "1.5px solid #f0f0f0",
  },
  td: { padding: "12px 16px", fontSize: 13, verticalAlign: "middle", color: "#1a1a2e", fontWeight: 600 },
  searchBox: { position: "relative", width: 320 },
  searchIcon: {
    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
    color: "#6372ff", fontSize: 14, pointerEvents: "none",
  },
  searchInput: {
    width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10,
    border: "1.5px solid #d0d4ff", fontSize: 14, outline: "none",
    boxSizing: "border-box", background: "#fff", color: "#1a1a2e", fontWeight: 600,
  },
  searchClear: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 13, padding: 0,
  },
  empty: {
    background: "#fff", borderRadius: 12, padding: "50px 30px",
    textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  alertError:   { background: "#fff0f3", color: "#c00", padding: "10px 16px", borderRadius: 8, border: "1px solid #ffd0d8", display: "flex", alignItems: "center" },
  alertSuccess: { background: "#f0fff4", color: "#1a7c40", padding: "10px 16px", borderRadius: 8, border: "1px solid #b7f0cc", display: "flex", alignItems: "center" },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 999,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 340, width: "90%",
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)", textAlign: "center",
  },
  modalIcon: {
    width: 60, height: 60, borderRadius: "50%", background: "#fff0f3",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
};

export default Ventas;