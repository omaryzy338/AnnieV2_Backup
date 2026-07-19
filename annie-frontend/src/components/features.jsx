import React from "react";

export const Features = (props) => {
  return (
    <div id="features" className="text-center">
      <div className="container">
        <div className="col-xs-12 col-md-10 col-md-offset-1 section-title">
          <h2>Propuesta</h2>
          <p>
            Annie nace como respuesta a los desafíos que enfrentan miles de emprendedores en Latinoamérica.
          </p>
        </div>
        <div className="row" style={{ marginTop: "40px" }}>
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.title}-${i}`} className="col-xs-12 col-sm-6 col-md-3" style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      padding: "28px 16px",
                      borderRadius: "8px",
                      height: "100%",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start"
                    }}
                  >
                    <i
                      className={d.icon}
                      title={d.title}
                      aria-label={d.title}
                      style={{
                        fontSize: "clamp(40px, 8vw, 56px)",
                        color: "#6372ff",
                        display: "block",
                        marginBottom: "16px"
                      }}
                    ></i>
                    <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: "600", color: "#1a1a2e" }}>
                      {d.title}
                    </h3>
                    <p style={{ color: "#666", fontSize: "clamp(12px, 2.5vw, 14px)", lineHeight: "1.5", margin: 0 }}>
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
