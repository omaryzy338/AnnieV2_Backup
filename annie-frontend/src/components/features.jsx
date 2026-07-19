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
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <i 
                      className={d.icon}
                      title={d.title}
                      aria-label={d.title}
                      style={{ 
                        fontSize: "clamp(44px, 10vw, 72px)", 
                        color: "#6372ff",
                        display: "block"
                      }}
                    ></i>
                    <span className="sr-only">{d.title}</span>
                  </div>
                </div>
              ))
            : "Loading..."}
        </div>
      </div>
    </div>
  );
};
