import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar    from "../dashboard/components/Sidebar";
import TopBar     from "../dashboard/components/TopBar";
import Inicio     from "../dashboard/pages/Inicio";
import Productos  from "../dashboard/pages/Productos";
import Ventas     from "../dashboard/pages/Ventas";
import Clientes   from "../dashboard/pages/Clientes";
import Creditos   from "../dashboard/pages/Creditos";
import Reportes   from "../dashboard/pages/Reportes";
import MiNegocio  from "../dashboard/pages/MiNegocio";
import Empleados  from "../dashboard/pages/Empleados";
import useIsMobile from "../hooks/useIsMobile";
import useSesion from "../hooks/useSesion";
import "../dashboard/dashboard.css";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const { esDueno } = useSesion();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reportes, Mi Negocio y Empleados son solo del dueño: a un empleado que
  // entre por la dirección se le regresa al inicio
  const soloDueno = (pagina) => (esDueno ? pagina : <Navigate to="/dashboard" replace />);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "#f4f6f9" }}>
      {/* Overlay en mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 99 }}
        />
      )}

      {/* Sidebar */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenido principal */}
      <div style={{
        marginLeft: isMobile ? 0 : 240,
        flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      }}>
        <TopBar isMobile={isMobile} onMenuToggle={() => setSidebarOpen((p) => !p)} />
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : "30px 30px 30px" }}>
          <Routes>
            <Route index            element={<Inicio />} />
            <Route path="productos" element={<Productos />} />
            <Route path="ventas"    element={<Ventas />} />
            <Route path="clientes"  element={<Clientes />} />
            <Route path="creditos"  element={<Creditos />} />
            <Route path="reportes"   element={soloDueno(<Reportes />)} />
            <Route path="mi-negocio" element={soloDueno(<MiNegocio />)} />
            <Route path="empleados"  element={soloDueno(<Empleados />)} />
            {/* Cualquier otra dirección del panel regresa al inicio */}
            <Route path="*"          element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
