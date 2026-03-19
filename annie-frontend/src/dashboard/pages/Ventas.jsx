import React, { useEffect, useState, useRef } from "react";
import axios from "../../api/axiosConfig";

const formInicial = { productId: "", clientId: "", quantity: 1, discount: 0, discountType: "porcentaje" };

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
  const [productoSel, setProductoSel] = useState(null);
  const successTimer                  = useRef(null);

  const cargar = async () => {
    try {
      const [v, p, c] = await Promise.all([
        axios.get("/sales"),
        axios.get("/products"),
        axios.get("/clients"),
      ]);
      setVentas(v.data);
      setProductos(p.data);
      setClientes(c.data);
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
      const f = new Date(v.createdAt);
      if (periodo === "hoy")    return f.toDateString() === ahora.toDateString();
      if (periodo === "semana") { const h = new Date(ahora); h.setDate(ahora.getDate() - 7); return f >= h; }
      if (periodo === "mes")    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
      return true;
    });

  // KPIs
  const ventasHoy = ventas.filter((v) => new Date(v.createdAt).toDateString() === ahora.toDateString());
  const ventasMes = ventas.filter((v) => {
    const f = new Date(v.createdAt);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  });
  const totalMes       = ventasMes.reduce((a, v) => a + v.total, 0);
  const ticketPromedio = ventasMes.length ? (totalMes / ventasMes.length).toFixed(2) : "0.00";
  const clientesUnicos = new Set(ventasMes.filter((v) => v.client).map((v) => v.client._id)).size;

  const formatFecha = (iso) =>
    new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleExportCSV = () => {
    const header = ["Fecha", "Producto", "Cliente", "Cantidad", "Precio", "Descuento", "Total"];
    const rows = ventasFiltradas.map((v) => [
      new Date(v.createdAt).toLocaleString("es-MX"),
      v.product?.name || "",
      v.client?.name  || "Sin cliente",
      v.quantity, v.price, v.discount > 0 ? `${v.discount}` : "0", v.total,
    ]);
    const csv  = "\uFEFF" + [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "ventas.csv"; a.click();
    URL.revokeObjectURL(url);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h4 style={{ margin: 0, color: "#1a1a2e" }}>
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
      <div style={styles.kpiGrid}>
        {[
          { icon: "fa-bolt",       bg: "#e8f5e9", color: "#27ae60", val: `$${ventasHoy.reduce((a,v) => a + v.total, 0).toFixed(2)}`, label: "Ventas hoy"         },
          { icon: "fa-calendar",   bg: "#f0f2ff", color: "#6372ff", val: `$${totalMes.toFixed(2)}`,                                   label: "Total este mes"     },
          { icon: "fa-line-chart", bg: "#fff8e1", color: "#f9a825", val: `$${ticketPromedio}`,                                        label: "Ticket promedio"    },
          { icon: "fa-users",      bg: "#fce4ec", color: "#e91e63", val: clientesUnicos,                                              label: "Clientes este mes"  },
        ].map(({ icon, bg, color, val, label }) => (
          <div key={label} style={styles.kpiCard}>
            <div style={{ ...styles.kpiIcon, background: bg }}>
              <i className={`fa ${icon}`} style={{ color, fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.1 }}>{val}</div>
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
            <div style={styles.formGrid}>

              {/* Producto (ancho completo) */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-cube" style={styles.labelIcon} />Producto *
                </label>
                <select style={styles.input} name="productId" value={form.productId}
                  onChange={handleChange} required>
                  <option value="">Seleccionar producto</option>
                  {productos.map((p) => (
                    <option key={p._id} value={p._id} disabled={p.quantity < 1}>
                      {p.name}{p.brand ? ` - ${p.brand}` : ""} | Stock: {p.quantity} | ${p.price}
                      {p.discount > 0 ? ` (-${p.discount}%)` : ""}
                    </option>
                  ))}
                </select>
                {/* Preview producto seleccionado */}
                {productoSel && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14,
                    background: "#f8f9ff", border: "1.5px solid #e8eaff", borderRadius: 10, padding: "10px 14px" }}>
                    {productoSel.image ? (
                      <img
                        src={productoSel.image.startsWith("/uploads") ? `http://localhost:5000${productoSel.image}` : productoSel.image}
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
                        {" - "}
                        Precio: <strong>${productoSel.price}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cliente */}
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-user" style={styles.labelIcon} />Cliente (opcional)
                </label>
                <select style={styles.input} name="clientId" value={form.clientId} onChange={handleChange}>
                  <option value="">Sin cliente</option>
                  {clientes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} {c.lastName || ""}</option>
                  ))}
                </select>
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

              {/* Descuento (ancho completo) */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-tag" style={styles.labelIcon} />Descuento en esta venta
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Toggle tipo */}
                  {[
                    { v: "porcentaje", icon: "fa-percent",   l: "Porcentaje %" },
                    { v: "fijo",       icon: "fa-dollar",    l: "Monto fijo $" },
                  ].map(({ v, icon, l }) => (
                    <button key={v} type="button"
                      onClick={() => setForm((p) => ({ ...p, discountType: v, discount: 0 }))}
                      style={{
                        padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                        border: form.discountType === v ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                        background: form.discountType === v ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                        color: form.discountType === v ? "#fff" : "#666",
                      }}>
                      <i className={`fa ${icon}`} style={{ fontSize: 11 }} />{l}
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
                    </div>
                  )}
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#9599b3", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Total</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#27ae60" }}>${calcTotal()}</div>
                  </div>
                </div>
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

      {/* Barra busqueda + periodo + exportar */}
      {ventas.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={styles.searchBox}>
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

          <button onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto",
              background: "#fff", color: "#6372ff", border: "1.5px solid #d0d4ff",
              borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            <i className="fa fa-download" />Exportar CSV
          </button>
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
      ) : (
        <div style={styles.tableCard}>
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
                    {formatFecha(v.createdAt)}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {v.product?.image ? (
                        <img
                          src={v.product.image.startsWith("/uploads") ? `http://localhost:5000${v.product.image}` : v.product.image}
                          alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6,
                            border: "1.5px solid #e8eaff", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f0f2ff",
                          border: "1.5px solid #e8eaff", display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0 }}>
                          <i className="fa fa-cube" style={{ color: "#c8ccff", fontSize: 13 }} />
                        </div>
                      )}
                      <strong style={{ color: "#1a1a2e" }}>{v.product?.name || "-"}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {v.client
                      ? <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{v.client.name}</span>
                      : <span style={{ color: "#ccc", fontSize: 12 }}>-</span>}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center", fontWeight: 700 }}>{v.quantity}</td>
                  <td style={styles.td}>${v.price}</td>
                  <td style={styles.td}>
                    {v.discount > 0
                      ? <span style={{ background: "#fff0f3", color: "#e05555", borderRadius: 6,
                          padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>
                          {v.discountType === "fijo" ? `$${v.discount}` : `${v.discount}%`}
                        </span>
                      : <span style={{ color: "#ccc" }}>-</span>}
                  </td>
                  <td style={styles.td}>
                    <strong style={{ color: "#27ae60", fontSize: 15 }}>${v.total}</strong>
                  </td>
                  <td style={styles.td}>
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
    background: "#fff", borderRadius: 12, padding: "16px 18px",
    boxShadow: "0 2px 10px rgba(99,114,255,0.07)", border: "1.5px solid #f0f2ff",
    display: "flex", alignItems: "center", gap: 14,
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
    border: "1.5px solid #e8eaff", borderRadius: 8, padding: "9px 12px",
    fontSize: 13, color: "#1a1a2e", outline: "none",
    background: "#fafbff", width: "100%", boxSizing: "border-box",
  },
  resumen: {
    background: "linear-gradient(135deg, #f8f9ff, #eef0ff)",
    border: "1.5px solid #e0e3ff", borderRadius: 10, padding: "16px 20px", marginTop: 14,
  },
  tableCard: {
    background: "#fff", borderRadius: 12, overflow: "hidden",
    boxShadow: "0 2px 10px rgba(99,114,255,0.07)", border: "1.5px solid #f0f2ff",
  },
  th: {
    padding: "12px 16px", fontSize: 11, color: "#9599b3",
    fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
    textAlign: "left", borderBottom: "1.5px solid #f0f0f0",
  },
  td: { padding: "12px 16px", fontSize: 13, verticalAlign: "middle" },
  searchBox: {
    display: "flex", alignItems: "center", background: "#fff",
    border: "1.5px solid #e8eaff", borderRadius: 8, padding: "6px 12px",
    gap: 8, minWidth: 200, flex: 1, maxWidth: 320,
  },
  searchIcon:  { color: "#b0b4d0", fontSize: 14 },
  searchInput: { border: "none", outline: "none", fontSize: 13, color: "#1a1a2e", width: "100%", background: "transparent" },
  searchClear: { background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 12, padding: 0 },
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