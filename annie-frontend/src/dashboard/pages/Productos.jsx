import React, { useEffect, useState, useRef } from "react";
import axios from "../../api/axiosConfig";

const CATEGORIAS = [
  { label: "Bebidas",            icon: "fa-tint",      color: "#4fc3f7", bg: "#e1f5fe" },
  { label: "Snacks",             icon: "fa-leaf",      color: "#81c784", bg: "#e8f5e9" },
  { label: "Alimentos",          icon: "fa-cutlery",   color: "#ff8a65", bg: "#fbe9e7" },
  { label: "Dulces y chocolates",icon: "fa-heart",     color: "#f06292", bg: "#fce4ec" },
  { label: "Lácteos",            icon: "fa-cube",      color: "#90caf9", bg: "#e3f2fd" },
  { label: "Panadería",          icon: "fa-circle",    color: "#ffb74d", bg: "#fff3e0" },
  { label: "Limpieza",           icon: "fa-trash",     color: "#4dd0e1", bg: "#e0f7fa" },
  { label: "Higiene personal",   icon: "fa-medkit",    color: "#ce93d8", bg: "#f3e5f5" },
  { label: "Papelería",          icon: "fa-pencil",    color: "#7986cb", bg: "#e8eaf6" },
  { label: "Electrónica",        icon: "fa-bolt",      color: "#ffd54f", bg: "#fffde7" },
  { label: "Ferretería",         icon: "fa-wrench",    color: "#a1887f", bg: "#efebe9" },
  { label: "Juguetes",           icon: "fa-gamepad",   color: "#4db6ac", bg: "#e0f2f1" },
  { label: "Ropa y accesorios",  icon: "fa-tag",       color: "#f48fb1", bg: "#fce4ec" },
  { label: "Servicios",          icon: "fa-star",      color: "#9575cd", bg: "#ede7f6" },
  { label: "Otro",               icon: "fa-th-large",  color: "#90a4ae", bg: "#eceff1" },
];

const camposIniciales = { name: "", description: "", price: "", cost: "", quantity: "", category: "", unit: "", brand: "", image: "" };

const UNIDADES = [
  { value: "",       label: "Sin unidad"  },
  { value: "piezas", label: "Piezas"      },
  { value: "kg",     label: "Kilogramos"  },
  { value: "g",      label: "Gramos"      },
];

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(camposIniciales);
  const [editId, setEditId]       = useState(null);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [catCustom, setCatCustom] = useState("");
  const [filtro, setFiltro]       = useState("Todos");
  const [busqueda, setBusqueda]   = useState("");
  const [confirmId, setConfirmId] = useState(null); // id del producto a eliminar
  const [imgModo, setImgModo]     = useState("url");  // "url" | "archivo"
  const [uploading, setUploading] = useState(false);
  const [ordenar, setOrdenar]     = useState("");      // "" | "stock_asc" | "stock_desc" | "precio_desc"
  const [vista, setVista]         = useState("tabla"); // "tabla" | "grid"
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    setUploading(true);
    try {
      const res = await axios.post("/products/upload-image", fd);
      setForm((prev) => ({ ...prev, image: res.data.url }));
    } catch { setError("Error al subir imagen"); }
    finally { setUploading(false); }
  };

  const mostrarExito = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const cargar = async () => {
    try {
      const res = await axios.get("/products");
      setProductos(res.data);
    } catch { setError("Error al cargar productos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const payload = {
      ...form,
      category: form.category === "Otro" ? catCustom : form.category,
    };
    try {
      if (editId) {
        await axios.put(`/products/${editId}`, payload);
        mostrarExito("Producto actualizado correctamente");
      } else {
        await axios.post("/products", payload);
        mostrarExito("Producto creado correctamente");
      }
      setForm(camposIniciales); setCatCustom("");
      setShowForm(false); setEditId(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar producto");
    }
  };

  const handleEditar = (p) => {
    const esPredefinida = CATEGORIAS.some((c) => c.label === p.category);
    setForm({ name: p.name, description: p.description || "", price: p.price, cost: p.cost || "", quantity: p.quantity,
      category: esPredefinida ? p.category : "Otro", unit: p.unit || "piezas", brand: p.brand || "", image: p.image || "" });
    setCatCustom(!esPredefinida ? p.category || "" : "");
    setEditId(p._id); setShowForm(true); setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    try { await axios.delete(`/products/${id}`); mostrarExito("Producto eliminado"); cargar(); }
    catch { setError("Error al eliminar"); }
    finally { setConfirmId(null); }
  };

  const handleExportCSV = () => {
    const headers = ["Nombre", "Marca", "Categoría", "Precio venta", "Precio costo", "Margen%", "Stock", "Unidad"];
    const rows = productos.map((p) => {
      const margen = p.cost > 0 ? ((p.price - p.cost) / p.price * 100).toFixed(1) : "";
      return [`"${p.name}"`, `"${p.brand || ""}"`, `"${p.category || ""}"`, p.price, p.cost || 0, margen, p.quantity, `"${p.unit || ""}"`];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inventario.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Categorías que aparecen en los productos actuales (para los filtros)
  const categoriasEnUso = ["Todos", ...new Set(productos.map((p) => p.category).filter(Boolean))];

  // KPIs
  const valorInventario  = productos.reduce((a, p) => a + (p.price * p.quantity), 0);
  const stockBajo        = productos.filter((p) => p.quantity < 5).length;
  const totalCategorias  = new Set(productos.map((p) => p.category).filter(Boolean)).size;
  const hayFiltros       = filtro !== "Todos" || busqueda;

  const productosFiltrados = productos
    .filter((p) => filtro === "Todos" || p.category === filtro)
    .filter((p) => !busqueda || p.name.toLowerCase().includes(busqueda.toLowerCase()))
    .slice()
    .sort((a, b) => {
      if (ordenar === "stock_asc")   return a.quantity - b.quantity;
      if (ordenar === "stock_desc")  return b.quantity - a.quantity;
      if (ordenar === "precio_desc") return b.price - a.price;
      if (ordenar === "precio_asc")  return a.price - b.price;
      if (ordenar === "antiguo")     return a._id < b._id ? -1 : 1;
      return 0;
    });

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Modal de confirmación eliminar */}
      {confirmId && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <i className="fa fa-trash" style={{ color: "#e05555", fontSize: 24 }} />
            </div>
            <h5 style={{ margin: "0 0 6px", color: "#1a1a2e", fontSize: 16 }}>¿Eliminar producto?</h5>
            <p style={{ margin: "0 0 20px", color: "#888", fontSize: 13 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button style={styles.btnModalCancel} onClick={() => setConfirmId(null)}>
                Cancelar
              </button>
              <button style={styles.btnModalDelete} onClick={() => handleEliminar(confirmId)}>
                <i className="fa fa-trash" style={{ marginRight: 7 }} />Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h4 style={{ margin: 0, color: "#1a1a2e" }}>
            <i className="fa fa-cube" style={{ color: "#6372ff", marginRight: 10 }} />
            Inventario de productos
          </h4>
          <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 13 }}>
            {productos.length} producto{productos.length !== 1 ? "s" : ""} registrados
          </p>
        </div>
        {showForm ? (
          <button style={styles.btnCancel} onClick={() => { setShowForm(false); setEditId(null); setForm(camposIniciales); }}>
            <i className="fa fa-times" style={{ marginRight: 8 }} />Cancelar
          </button>
        ) : (
          <button style={styles.btnPrimary} onClick={() => { setShowForm(true); setEditId(null); setForm(camposIniciales); }}>
            <i className="fa fa-plus" style={{ marginRight: 8 }} />Agregar producto
          </button>
        )}
      </div>

      {error   && <div style={styles.alertError}><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }} />{error}</div>}
      {success && <div style={styles.alertSuccess}><i className="fa fa-check-circle" style={{ marginRight: 8 }} />{success}</div>}

      {/* KPI cards */}
      {productos.length > 0 && (
        <div style={styles.kpiGrid}>
          {[
            { icon: "fa-cube",                 bg: "#f0f2ff", color: "#6372ff", val: productos.length,             label: "Total productos"       },
            { icon: "fa-money",                bg: "#e8f5e9", color: "#27ae60", val: `$${valorInventario.toFixed(2)}`, label: "Valor en inventario" },
            { icon: "fa-warning",  bg: "#fff0f3", color: "#e74c3c", val: stockBajo,       label: "Stock bajo (< 5)"  },
            { icon: "fa-tags",    bg: "#fff8e1", color: "#f9a825", val: totalCategorias, label: "Categorías en uso" },
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
      )}

      {/* Formulario */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <i className={`fa ${editId ? "fa-pencil" : "fa-cube"}`} style={{ color: "#6372ff", fontSize: 18 }} />
            <h5 style={{ margin: 0, color: "#1a1a2e" }}>{editId ? "Editar producto" : "Nuevo producto"}</h5>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>

              {/* Nombre */}
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-tag" style={styles.labelIcon} />Nombre *
                </label>
                <input style={styles.input} name="name" value={form.name}
                  onChange={handleChange} required placeholder="Ej: Coca Cola 600ml" />
              </div>

              {/* Marca */}
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-certificate" style={styles.labelIcon} />Marca
                </label>
                <input style={styles.input} name="brand" value={form.brand}
                  onChange={handleChange} placeholder="Ej: Coca-Cola, Bimbo, Nestlé..." />
              </div>

              {/* Categoría — grid de chips */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-list" style={styles.labelIcon} />Categoría
                </label>
                <div style={styles.catGrid}>
                  {CATEGORIAS.map((c) => {
                    const sel = form.category === c.label;
                    return (
                      <button key={c.label} type="button"
                        onClick={() => { setForm((p) => ({ ...p, category: sel ? "" : c.label })); if (sel) setCatCustom(""); }}
                        style={{
                          ...styles.catChip,
                          background: sel ? c.bg : "#fafafa",
                          border: sel ? `2px solid ${c.color}` : "1.5px solid #e8e8e8",
                          color: sel ? c.color : "#666",
                          fontWeight: sel ? 700 : 500,
                        }}>
                        <i className={`fa ${c.icon}`} style={{ fontSize: 15, color: sel ? c.color : "#bbb", marginBottom: 4, display: "block" }} />
                        <span style={{ fontSize: 11, lineHeight: 1.2 }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
                {form.category === "Otro" && (
                  <input style={{ ...styles.input, marginTop: 10 }}
                    placeholder="Escribe la categoría..."
                    value={catCustom}
                    onChange={(e) => setCatCustom(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Precio de venta */}
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-money" style={styles.labelIcon} />Precio de venta *
                </label>
                <div style={styles.inputPrefix}>
                  <span style={styles.prefix}>$</span>
                  <input style={{ ...styles.input, borderRadius: "0 8px 8px 0", borderLeft: "none" }}
                    name="price" type="number" min="0" step="0.01"
                    value={form.price} onChange={handleChange} required placeholder="0.00" />
                </div>
              </div>

              {/* Precio de costo */}
              <div style={styles.fieldWrap}>
                <label style={styles.label}>
                  <i className="fa fa-tag" style={styles.labelIcon} />Precio de costo
                </label>
                <div style={styles.inputPrefix}>
                  <span style={{ ...styles.prefix, background: "#f0fff4", color: "#27ae60" }}>$</span>
                  <input style={{ ...styles.input, borderRadius: "0 8px 8px 0", borderLeft: "none" }}
                    name="cost" type="number" min="0" step="0.01"
                    value={form.cost} onChange={handleChange} placeholder="0.00" />
                </div>
                {form.price && form.cost && parseFloat(form.cost) > 0 && (
                  <div style={{ fontSize: 12, color: "#27ae60", marginTop: 6, fontWeight: 700 }}>
                    <i className="fa fa-line-chart" style={{ marginRight: 4 }} />
                    Margen: {((parseFloat(form.price) - parseFloat(form.cost)) / parseFloat(form.price) * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Stock + Unidad (ancho completo) */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-archive" style={styles.labelIcon} />Stock *
                </label>
                <input
                  style={{ ...styles.input, maxWidth: 220 }}
                  name="quantity" type="number" min="0"
                  value={form.quantity} onChange={handleChange} required placeholder="0" />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {UNIDADES.map((u) => {
                    const sel = form.unit === u.value;
                    return (
                      <button key={u.value} type="button"
                        onClick={() => setForm((p) => ({ ...p, unit: u.value }))}
                        style={{
                          padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", border: sel ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                          background: sel ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                          color: sel ? "#fff" : "#666", transition: "all 0.15s",
                        }}>
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción (ancho completo) */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-align-left" style={styles.labelIcon} />Descripción
                </label>
                <input style={styles.input} name="description" value={form.description}
                  onChange={handleChange} placeholder="Descripción opcional del producto" />
              </div>

              {/* Imagen (ancho completo) */}
              <div style={{ ...styles.fieldWrap, gridColumn: "1 / -1" }}>
                <label style={styles.label}>
                  <i className="fa fa-image" style={styles.labelIcon} />Imagen del producto
                </label>
                {/* Tabs URL / Archivo */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {[
                    { v: "url",     icon: "fa-link",        l: "URL"    },
                    { v: "archivo", icon: "fa-folder-open", l: "Archivo" },
                  ].map(({ v, icon, l }) => (
                    <button key={v} type="button" onClick={() => setImgModo(v)}
                      style={{
                        padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                        border: imgModo === v ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                        background: imgModo === v ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                        color: imgModo === v ? "#fff" : "#666",
                      }}>
                      <i className={`fa ${icon}`} style={{ fontSize: 12 }} />{l}
                    </button>
                  ))}
                </div>
                {imgModo === "url" ? (
                  <input style={styles.input} name="image" value={form.image}
                    onChange={handleChange} placeholder="https://ejemplo.com/imagen.jpg" />
                ) : (
                  <div>
                    <input type="file" accept="image/*" id="imgFileInput" style={{ display: "none" }}
                      onChange={handleImageFile} />
                    <label htmlFor="imgFileInput" style={{
                      display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                      background: "#f4f6ff", border: "1.5px dashed #6372ff", borderRadius: 8,
                      padding: "10px 20px", fontSize: 13, color: "#6372ff", fontWeight: 600,
                    }}>
                      {uploading
                        ? <><i className="fa fa-spinner fa-spin" /> Subiendo...</>
                        : <><i className="fa fa-upload" /> Seleccionar imagen</>}
                    </label>
                  </div>
                )}
                {/* Preview */}
                {form.image && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                    <img
                      src={form.image.startsWith("/uploads") ? `http://localhost:5000${form.image}` : form.image}
                      alt="preview"
                      style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "2px solid #e8eaff" }}
                    />
                    <button type="button"
                      onClick={() => setForm((p) => ({ ...p, image: "" }))}
                      style={styles.btnDelete}>
                      <i className="fa fa-times" style={{ marginRight: 5 }} />Quitar imagen
                    </button>
                  </div>
                )}
              </div>

            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="submit" style={styles.btnSuccess}>
                <i className={`fa ${editId ? "fa-save" : "fa-plus"}`} style={{ marginRight: 8 }} />
                {editId ? "Guardar cambios" : "Crear producto"}
              </button>
              <button type="button" style={styles.btnCancel}
                onClick={() => { setShowForm(false); setEditId(null); setForm(camposIniciales); }}>
                <i className="fa fa-times" style={{ marginRight: 7 }} />Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de búsqueda + Ordenar + Exportar */}
      {productos.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={styles.searchBox}>
            <i className="fa fa-search" style={styles.searchIcon} />
            <input
              style={styles.searchInput}
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={styles.searchClear}>
                <i className="fa fa-times" />
              </button>
            )}
          </div>

          {/* Botones de ordenamiento */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { v: "",            icon: "fa-clock-o",           l: "Reciente"    },
              { v: "antiguo",     icon: "fa-history",            l: "Más antiguo" },
              { v: "stock_asc",   icon: "fa-arrow-up",          l: "Menor stock" },
              { v: "stock_desc",  icon: "fa-arrow-down",        l: "Mayor stock" },
              { v: "precio_desc", icon: "fa-sort-numeric-desc", l: "Más caro"    },
              { v: "precio_asc",  icon: "fa-sort-numeric-asc",  l: "Más barato"  },
            ].map(({ v, icon, l }) => (
              <button key={v} onClick={() => setOrdenar(v)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  background: ordenar === v ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                  color: ordenar === v ? "#fff" : "#666",
                  border: ordenar === v ? "1.5px solid transparent" : "1.5px solid #e0e0e0",
                }}>
                <i className={`fa ${icon}`} style={{ fontSize: 11 }} />{l}
              </button>
            ))}
          </div>

          {/* Exportar */}
          <button onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto",
              background: "#fff", color: "#6372ff", border: "1.5px solid #d0d4ff",
              borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            <i className="fa fa-download" />Exportar CSV
          </button>

          {/* Toggle vista */}
          <div style={{ display: "flex", border: "1.5px solid #e0e0e0", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
            {[{ v: "tabla", icon: "fa-list" }, { v: "grid", icon: "fa-th" }].map(({ v, icon }) => (
              <button key={v} onClick={() => setVista(v)}
                style={{
                  padding: "7px 13px", border: "none", cursor: "pointer",
                  background: vista === v ? "linear-gradient(to right,#6372ff,#5ca9fb)" : "#fff",
                  color: vista === v ? "#fff" : "#999", fontSize: 13,
                }}>
                <i className={`fa ${icon}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros por categoría + contador */}
      {productos.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={styles.filtros}>
            {categoriasEnUso.map((cat) => {
              const catData = CATEGORIAS.find((c) => c.label.toLowerCase() === cat.toLowerCase());
              const esActivo = filtro === cat;
              return (
                <button key={cat}
                  style={{
                    ...styles.filtroBtn,
                    ...(esActivo ? styles.filtroActivo : {}),
                    ...((!esActivo && cat !== "Todos") ? { borderColor: catData?.color || "#e8e8e8" } : {}),
                  }}
                  onClick={() => setFiltro(cat)}>
                  {cat !== "Todos" && (
                    <i className={`fa ${catData?.icon || "fa-tag"}`}
                      style={{ marginRight: 6, fontSize: 13, color: esActivo ? "#fff" : catData?.color }} />
                  )}
                  {cat}
                  {cat !== "Todos" && (
                    <span style={{ ...styles.filtroCount, background: esActivo ? "rgba(255,255,255,0.3)" : catData?.bg, color: esActivo ? "#fff" : catData?.color }}>
                      {productos.filter((p) => p.category === cat).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>
              {productosFiltrados.length} de {productos.length} productos
            </span>
            {hayFiltros && (
              <button onClick={() => { setFiltro("Todos"); setBusqueda(""); setOrdenar(""); }}
                style={{ background: "none", border: "1.5px solid #f0c0c8", borderRadius: 6,
                  color: "#e05555", fontSize: 12, fontWeight: 600, padding: "4px 10px", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5 }}>
                <i className="fa fa-times" style={{ fontSize: 10 }} />Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabla / Grid */}
      {productos.length === 0 ? (
        <div style={styles.empty}>
          <i className="fa fa-cube" style={{ fontSize: 40, color: "#d0d4ff", display: "block", marginBottom: 12 }} />
          <div style={{ fontWeight: 600, color: "#555", marginBottom: 4 }}>Sin productos todavía</div>
          <div style={{ color: "#aaa", fontSize: 13 }}>Agrega tu primer producto con el botón de arriba</div>
        </div>
      ) : vista === "grid" ? (
        /* ── Vista Grid ────────────────────────────────────────── */
        <div style={styles.gridContainer}>
          {productosFiltrados.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 13 }}>
              Sin resultados
            </div>
          ) : productosFiltrados.map((p) => {
            const cat = CATEGORIAS.find((c) => c.label.toLowerCase() === (p.category || "").toLowerCase());
            return (
              <div key={p._id} style={styles.gridCard}>
                {/* Imagen */}
                <div style={styles.gridImg}>
                  {p.image ? (
                    <img src={p.image.startsWith("/uploads") ? `http://localhost:5000${p.image}` : p.image}
                      alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="fa fa-cube" style={{ color: "#d0d4ff", fontSize: 30 }} />
                  )}
                  {/* Badge stock */}
                  <span style={{
                    position: "absolute", top: 8, right: 8,
                    background: p.quantity < 5 ? "#fff0f3" : p.quantity < 15 ? "#fff8e1" : "#f0fff4",
                    color: p.quantity < 5 ? "#e74c3c" : p.quantity < 15 ? "#e08c00" : "#27ae60",
                    border: `1.5px solid ${p.quantity < 5 ? "#ffd0d8" : p.quantity < 15 ? "#ffe082" : "#b7f0cc"}`,
                    borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                  }}>
                    {p.quantity} {p.unit || "uds."}
                  </span>
                </div>
                {/* Info */}
                <div style={{ padding: "12px 14px 14px" }}>
                  {cat && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg,
                      borderRadius: 5, padding: "2px 7px", display: "inline-block", marginBottom: 6 }}>
                      <i className={`fa ${cat.icon}`} style={{ marginRight: 4, fontSize: 10 }} />{p.category}
                    </span>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  {p.brand && <div style={{ fontSize: 11, color: "#6372ff", marginTop: 1, fontWeight: 600 }}>{p.brand}</div>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>${p.price}</div>
                      {p.cost > 0 && (
                        <div style={{ fontSize: 10, color: "#27ae60", fontWeight: 700 }}>
                          {((p.price - p.cost) / p.price * 100).toFixed(0)}% margen
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={{ ...styles.btnEdit, padding: "5px 9px", marginRight: 0 }} onClick={() => handleEditar(p)}>
                        <i className="fa fa-pencil" />
                      </button>
                      <button style={{ ...styles.btnDelete, padding: "5px 9px" }} onClick={() => setConfirmId(p._id)}>
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Vista Tabla ─────────────────────────────────────── */
        <div style={styles.tableCard}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => (
                <tr key={p._id}
                  onMouseEnter={() => setHoveredRow(p._id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: "1px solid #f0f0f0",
                    background: hoveredRow === p._id ? "#f8f9ff" : "transparent",
                    transition: "background 0.12s" }}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {p.image ? (
                        <img
                          src={p.image.startsWith("/uploads") ? `http://localhost:5000${p.image}` : p.image}
                          alt=""
                          style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 8,
                            border: "1.5px solid #e8eaff", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f0f2ff",
                          border: "1.5px solid #e8eaff", display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0 }}>
                          <i className="fa fa-cube" style={{ color: "#c8ccff", fontSize: 16 }} />
                        </div>
                      )}
                      <div>
                        <strong style={{ color: "#1a1a2e" }}>{p.name}</strong>
                        {p.brand && <div style={{ fontSize: 12, color: "#6372ff", marginTop: 1, fontWeight: 600 }}>{p.brand}</div>}
                        {p.description && <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {p.category ? (() => {
                      const cat = CATEGORIAS.find((c) => c.label.toLowerCase() === p.category.toLowerCase());
                      return (
                        <span style={{
                          background: cat?.bg || "#f0f2ff", color: cat?.color || "#6372ff",
                          borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600,
                          display: "inline-flex", alignItems: "center",
                        }}>
                          <i className={`fa ${cat?.icon || "fa-tag"}`} style={{ marginRight: 6, fontSize: 12 }} />
                          {p.category}
                        </span>
                      );
                    })() : <span style={{ color: "#ccc" }}>—</span>}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>
                    <div>${p.price}</div>
                    {p.cost > 0 && (
                      <div style={{ fontSize: 11, color: "#27ae60", fontWeight: 700, marginTop: 2 }}>
                        <i className="fa fa-line-chart" style={{ marginRight: 3, fontSize: 10 }} />
                        {((p.price - p.cost) / p.price * 100).toFixed(0)}% margen
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: p.quantity < 5 ? "rgba(231,76,60,0.1)" : p.quantity < 15 ? "rgba(255,152,0,0.1)" : "rgba(39,174,96,0.1)",
                      color: p.quantity < 5 ? "#e74c3c" : p.quantity < 15 ? "#e08c00" : "#27ae60",
                      borderRadius: 20, padding: "4px 10px", fontWeight: 700, fontSize: 12,
                    }}>
                      <i className="fa fa-archive" style={{ fontSize: 10 }} />
                      {p.quantity} {p.unit || "uds."}
                      {p.quantity < 5 && <i className="fa fa-exclamation-triangle" style={{ fontSize: 10 }} />}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.btnEdit} onClick={() => handleEditar(p)}>
                      <i className="fa fa-pencil" style={{ marginRight: 5 }} />Editar
                    </button>
                    <button style={styles.btnDelete} onClick={() => setConfirmId(p._id)}>
                      <i className="fa fa-trash" style={{ marginRight: 5 }} />Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productosFiltrados.length === 0 && (
            <div style={{ padding: "30px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
              {busqueda
                ? <>No hay productos que coincidan con <strong>"{busqueda}"</strong></>
                : <>No hay productos en la categoría <strong>{filtro}</strong></>}
            </div>
          )}
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
  btnEdit: {
    background: "#f4f6ff", color: "#6372ff", border: "1px solid #c8ccff",
    borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, marginRight: 6, display: "inline-flex", alignItems: "center",
  },
  btnDelete: {
    background: "#fff0f3", color: "#e05555", border: "1px solid #ffd0d8",
    borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, display: "inline-flex", alignItems: "center",
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
  labelIcon: { color: "#6372ff", fontSize: 12 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8",
    fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa",
    transition: "border-color 0.2s",
  },
  inputPrefix: { display: "flex" },
  prefix: {
    background: "#f0f2ff", border: "1.5px solid #e8e8e8", borderRight: "none",
    borderRadius: "8px 0 0 8px", padding: "10px 12px", color: "#6372ff",
    fontWeight: 700, fontSize: 15, lineHeight: 1.2,
  },
  tableCard: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  th: {
    padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#888",
    fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
  },
  td: { padding: "12px 16px", fontSize: 13, verticalAlign: "middle" },
  catBadge: {
    background: "#f0f2ff", color: "#6372ff", borderRadius: 6,
    padding: "3px 10px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center",
  },
  filtros: { display: "flex", gap: 8, flexWrap: "wrap" },
  filtroBtn: {
    background: "#fff", color: "#666", border: "1.5px solid #e8e8e8",
    borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12,
    fontWeight: 600, display: "inline-flex", alignItems: "center", transition: "all 0.15s",
  },
  filtroActivo: {
    background: "linear-gradient(to right, #6372ff, #5ca9fb)",
    color: "#fff", border: "1.5px solid transparent",
  },
  filtroCount: {
    background: "rgba(255,255,255,0.3)", borderRadius: 10,
    padding: "1px 6px", fontSize: 11, marginLeft: 6,
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
    width: 56, height: 56, borderRadius: "50%", background: "#fff0f3",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  btnModalCancel: {
    background: "#f4f6f9", color: "#666", border: "1px solid #e0e0e0",
    borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnModalDelete: {
    background: "linear-gradient(to right, #e74c3c, #c0392b)", color: "#fff", border: "none",
    borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14,
    display: "inline-flex", alignItems: "center",
  },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "10px 6px", borderRadius: 10, cursor: "pointer",
    transition: "all 0.15s", minHeight: 64, textAlign: "center",
  },
  kpiGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
  },
  kpiCard: {
    background: "#fff", borderRadius: 12, padding: "14px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12,
  },
  kpiIcon: {
    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  gridContainer: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14,
  },
  gridCard: {
    background: "#fff", borderRadius: 12, overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: "1.5px solid #f0f2ff",
  },
  gridImg: {
    height: 130, background: "#f0f2ff", display: "flex", alignItems: "center",
    justifyContent: "center", position: "relative", overflow: "hidden",
  },
  unitSelect: {
    border: "1.5px solid #e8e8e8", borderLeft: "none", borderRadius: "0 8px 8px 0",
    padding: "10px 8px", fontSize: 13, background: "#f0f2ff", color: "#6372ff",
    fontWeight: 700, cursor: "pointer", outline: "none",
  },
  searchBox: {
    position: "relative",
    width: 280,
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
    padding: "10px 14px 10px 40px",
    borderRadius: 10,
    border: "1.5px solid #d0d4ff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#333",
  },
  searchClear: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 13, padding: 0,
  },
};

export default Productos;
