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
        <div className="row" style={{ marginTop: "40px" }}>
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-xs-12 col-sm-6 col-md-3" style={{ marginBottom: "30px" }}>
                  <div 
                    style={{
                      padding: "28px 16px",
                      borderRadius: "8px",
                      backgroundColor: "#f8f9fa",
                      minHeight: "clamp(240px, 50vh, 280px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <i 
                      className={d.icon}
                      title={d.name}
                      aria-label={d.name}
                      style={{ 
                        fontSize: "clamp(44px, 10vw, 72px)", 
                        color: "#6372ff",
                        display: "block"
                      }}
                    ></i>
                    <span className="sr-only">{d.name}</span>
                  </div>
                </div>
              ))
            : "loading"}
        </div>
      </div>
    </div>
  );
};
