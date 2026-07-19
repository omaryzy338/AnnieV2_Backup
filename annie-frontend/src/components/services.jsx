import React from "react";

export const Services = (props) => {
  return (
    <div id="services" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Funcionalidades Principales</h2>
          <p>
            Herramientas esenciales diseñadas para ayudarte a gestionar tu negocio de manera eficiente, organizada y profesional.
          </p>
        </div>
        <div className="row" style={{ marginTop: "40px", display: "flex", flexWrap: "wrap" }}>
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-xs-12 col-sm-6 col-md-3" style={{ marginBottom: "30px", display: "flex" }}>
                  <div
                    style={{
                      padding: "20px",
                      borderRadius: "8px",
                      backgroundColor: "#f8f9fa",
                      minHeight: "clamp(240px, 50vh, 280px)",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start"
                    }}
                  >
                    <i 
                      className={d.icon}
                      style={{ 
                        fontSize: "clamp(36px, 8vw, 48px)", 
                        color: "#6372ff",
                        marginBottom: "16px",
                        display: "block"
                      }}
                    ></i>
                    <h3 style={{ marginTop: "12px", marginBottom: "12px", fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: "600", color: "#1a1a2e" }}>
                      {d.name}
                    </h3>
                    <p style={{ color: "#666", fontSize: "clamp(12px, 2.5vw, 14px)", lineHeight: "1.5", marginBottom: 0 }}>
                      {d.text}
                    </p>
                  </div>
                </div>
              ))
            : "loading"}
        </div>
      </div>
    </div>
  );
};
