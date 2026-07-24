import React from "react";

export const About = (props) => {
  return (
    <div id="about">
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-6" style={{ marginBottom: "30px" }}>
            <img 
              src="/img/about.jpg"
              className="img-responsive" 
              alt="Annie 2.0"
              style={{ borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            />
          </div>
          <div className="col-xs-12 col-md-6" style={{ paddingLeft: "20px" }}>
            <div className="about-text">
              <h2 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "16px", color: "#333" }}>
                ¿Qué es Annie?
              </h2>
              <p
                style={{ color: "#666", lineHeight: "1.7", marginBottom: "24px", fontSize: "15px" }}
                dangerouslySetInnerHTML={{
                  __html: props.data ? props.data.paragraph.replace(/Annie/g, "<strong>Annie</strong>") : "loading..."
                }}
              />
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px", marginTop: "32px", color: "#333" }}>
                ¿Por qué elegirnos?
              </h3>
              <div className="list-style">
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul style={{ paddingLeft: "20px" }}>
                    {props.data
                      ? props.data.Why.map((d, i) => (
                          <li key={`${d}-${i}`} style={{ marginBottom: "10px", color: "#555" }}>
                            <i className="fa fa-check" style={{ color: "#6372ff", marginRight: "8px" }}></i>
                            {d}
                          </li>
                        ))
                      : "loading"}
                  </ul>
                </div>
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul style={{ paddingLeft: "20px" }}>
                    {props.data
                      ? props.data.Why2.map((d, i) => (
                          <li key={`${d}-${i}`} style={{ marginBottom: "10px", color: "#555" }}>
                            <i className="fa fa-check" style={{ color: "#6372ff", marginRight: "8px" }}></i>
                            {d}
                          </li>
                        ))
                      : "loading"}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
