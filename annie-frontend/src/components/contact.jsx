import React from "react";
import { Link } from "react-router-dom";

export const Contact = (props) => {
  return (
    <>
      <div id="contact">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-8" style={{ marginBottom: "40px" }}>
              <div className="section-title">
                <h2 style={{ fontSize: "clamp(24px, 5vw, 32px)", marginBottom: "16px" }}>
                  Comienza Hoy
                </h2>
                <p style={{ fontSize: "clamp(14px, 3vw, 16px)", lineHeight: "1.6", marginBottom: "24px" }}>
                  {props.data ? props.data.address : "Loading"}
                </p>
                <p style={{ fontSize: "clamp(13px, 2.5vw, 15px)", color: "#666", marginBottom: "32px" }}>
                  {props.data ? props.data.phone : "Loading"}
                </p>
              </div>
              <div className="row" style={{ marginTop: "32px" }}>
                <div className="col-xs-12 col-sm-6" style={{ marginBottom: "16px" }}>
                  <Link
                    to="/register"
                    className="btn btn-custom btn-lg"
                    style={{ width: "100%", textAlign: "center", display: "block", padding: "14px 20px" }}
                  >
                    Crear Cuenta
                  </Link>
                </div>
                <div className="col-xs-12 col-sm-6" style={{ marginBottom: "16px" }}>
                  <Link
                    to="/login"
                    className="btn btn-custom btn-lg"
                    style={{ width: "100%", textAlign: "center", display: "block", padding: "14px 20px" }}
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-xs-12 col-md-3 col-md-offset-1 contact-info" style={{ marginTop: "30px" }}>
              <div className="contact-item" style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "clamp(14px, 2.5vw, 16px)", fontWeight: "600", marginBottom: "12px" }}>
                  Información
                </h3>
                <p style={{ fontSize: "clamp(12px, 2vw, 14px)", color: "#666" }}>
                  <span style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <i className="fa fa-envelope-o" style={{ marginRight: "8px", color: "#6372ff" }}></i> 
                    Email
                  </span>
                  <span style={{ marginLeft: "28px" }}>
                    {props.data ? props.data.email : "loading"}
                  </span>
                </p>
              </div>
              
              <div className="contact-item" style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "clamp(14px, 2.5vw, 16px)", fontWeight: "600", marginBottom: "12px" }}>
                  Síguenos
                </h3>
                <div style={{ display: "flex", gap: "16px" }}>
                  <a 
                    href={props.data ? props.data.facebook : "/"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: "clamp(16px, 4vw, 20px)", color: "#6372ff", textDecoration: "none" }}
                  >
                    <i className="fa fa-facebook"></i>
                  </a>
                  <a 
                    href={props.data ? props.data.twitter : "/"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: "clamp(16px, 4vw, 20px)", color: "#6372ff", textDecoration: "none" }}
                  >
                    <i className="fa fa-twitter"></i>
                  </a>
                  <a 
                    href={props.data ? props.data.youtube : "/"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: "clamp(16px, 4vw, 20px)", color: "#6372ff", textDecoration: "none" }}
                  >
                    <i className="fa fa-youtube"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="footer">
        <div className="container text-center">
          <p>
            &copy; 2026 ANNIE. Plataforma para gestión de pequeños negocios.
          </p>
        </div>
      </div>
    </>
  );
};
