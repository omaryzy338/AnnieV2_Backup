import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar    from "../dashboard/components/Sidebar";
import TopBar     from "../dashboard/components/TopBar";
import Inicio     from "../dashboard/pages/Inicio";
import Productos  from "../dashboard/pages/Productos";
import Ventas     from "../dashboard/pages/Ventas";
import Clientes   from "../dashboard/pages/Clientes";
import Reportes   from "../dashboard/pages/Reportes";
import MiNegocio  from "../dashboard/pages/MiNegocio";
import useWindowWidth from "../hooks/useWindowWidth";
import "../dashboard/dashboard.css";

const Dashboard = () => {
  const w = useWindowWidth();
  const isMobile = w < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <Route path="reportes"  element={<Reportes />} />
            <Route path="mi-negocio" element={<MiNegocio />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
