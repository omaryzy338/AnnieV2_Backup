// Listas y reglas fijas compartidas por varias pantallas del panel.

export const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
  "Ciudad de Mexico", "Coahuila", "Colima", "Durango", "Estado de Mexico", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "Michoacan", "Morelos", "Nayarit", "Nuevo Leon", "Oaxaca", "Puebla", "Queretaro",
  "Quintana Roo", "San Luis Potosi", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz",
  "Yucatan", "Zacatecas",
];

// Categorías de producto con su ícono y colores. "Otro" permite escribir una
// categoría propia.
export const CATEGORIAS = [
  { label: "Bebidas",             icon: "fa-tint",     color: "#4fc3f7", bg: "#e1f5fe" },
  { label: "Snacks",              icon: "fa-leaf",     color: "#81c784", bg: "#e8f5e9" },
  { label: "Alimentos",           icon: "fa-cutlery",  color: "#ff8a65", bg: "#fbe9e7" },
  { label: "Dulces y chocolates", icon: "fa-heart",    color: "#f06292", bg: "#fce4ec" },
  { label: "Lácteos",             icon: "fa-cube",     color: "#90caf9", bg: "#e3f2fd" },
  { label: "Panadería",           icon: "fa-circle",   color: "#ffb74d", bg: "#fff3e0" },
  { label: "Limpieza",            icon: "fa-trash",    color: "#4dd0e1", bg: "#e0f7fa" },
  { label: "Higiene personal",    icon: "fa-medkit",   color: "#ce93d8", bg: "#f3e5f5" },
  { label: "Papelería",           icon: "fa-pencil",   color: "#7986cb", bg: "#e8eaf6" },
  { label: "Electrónica",         icon: "fa-bolt",     color: "#ffd54f", bg: "#fffde7" },
  { label: "Ferretería",          icon: "fa-wrench",   color: "#a1887f", bg: "#efebe9" },
  { label: "Juguetes",            icon: "fa-gamepad",  color: "#4db6ac", bg: "#e0f2f1" },
  { label: "Ropa y accesorios",   icon: "fa-tag",      color: "#f48fb1", bg: "#fce4ec" },
  { label: "Servicios",           icon: "fa-star",     color: "#9575cd", bg: "#ede7f6" },
  { label: "Otro",                icon: "fa-th-large", color: "#90a4ae", bg: "#eceff1" },
];

export const UNIDADES = [
  { value: "",       label: "Sin unidad" },
  { value: "piezas", label: "Piezas"     },
  { value: "kg",     label: "Kilogramos" },
  { value: "g",      label: "Gramos"     },
];

// Umbrales de inventario usados en todo el panel (igual que en la app móvil):
// menos de STOCK_BAJO es rojo, menos de STOCK_MEDIO es naranja
export const STOCK_BAJO = 5;
export const STOCK_MEDIO = 15;

// Mínimo 8 caracteres, una mayúscula, un número y un carácter especial
// (misma regla que annie-backend/routes/auth.js)
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
