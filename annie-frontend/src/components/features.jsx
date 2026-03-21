import React from "react";

export const Features = (props) => {
  return (
    <div id="features" className="text-center">
      <div className="container">
        <div className="col-xs-12 col-md-10 col-md-offset-1 section-title">
          <h2>El Problema y Nuestra Solución</h2>
          <p>
            ANNIE nace como respuesta a los desafíos que enfrentan miles de emprendedores en Latinoamérica.
          </p>
        </div>
        <div className="row" style={{ marginTop: "40px" }}>
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.title}-${i}`} className="col-xs-12 col-sm-6 col-md-3" style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      height: "100%",
                      textAlign: "center"
                    }}
                  >
                    <i 
                      className={d.icon}
                      style={{ 
                        fontSize: "clamp(32px, 6vw, 40px)", 
                        color: "#6372ff",
                        marginBottom: "12px",
                        display: "block"
                      }}
                    ></i>
                    <h3 style={{ fontSize: "clamp(13px, 3vw, 16px)", fontWeight: "600", margin: "10px 0", minHeight: "auto" }}>
                      {d.title}
                    </h3>
                    <p style={{ fontSize: "clamp(11px, 2.2vw, 13px)", color: "#666", lineHeight: "1.5", margin: 0 }}>
                      {d.text}
                    </p>
                  </div>
                </div>
              ))
            : "Loading..."}
        </div>
      </div>
    </div>
  );
};
