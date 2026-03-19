import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar    from "../dashboard/components/Sidebar";
import TopBar     from "../dashboard/components/TopBar";
import Inicio     from "../dashboard/pages/Inicio";
import Productos  from "../dashboard/pages/Productos";
import Ventas     from "../dashboard/pages/Ventas";
import Clientes   from "../dashboard/pages/Clientes";
import Reportes   from "../dashboard/pages/Reportes";
import MiNegocio  from "../dashboard/pages/MiNegocio";

const Dashboard = () => {
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "#f4f6f9" }}>
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: "auto", padding: "30px 30px 30px" }}>
          <Routes>
            <Route index            element={<Inicio />} />
            <Route path="productos" element={<Productos />} />
            <Route path="ventas"    element={<Ventas />} />
            <Route path="clientes"  element={<Clientes />} />
            <Route path="reportes"  element={<Reportes />} />
            <Route path="negocio"   element={<MiNegocio />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
