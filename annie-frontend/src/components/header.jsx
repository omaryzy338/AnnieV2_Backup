import React from "react";
import { Link } from "react-router-dom";

export const Header = (props) => {
  return (
    <header
      id="header"
      style={{
        backgroundImage: "url('/img/intro-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        paddingTop: "min(140px, 20vw)",
      }}
    >
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-xs-12 col-md-8 col-md-offset-2 intro-text">
                <h1 
                  className="header-title" 
                  style={{ marginBottom: "20px" }}
                >
                  {props.data ? props.data.title : "Loading"}
                </h1>
                <p
                  className="header-paragraph"
                  style={{ marginBottom: "40px", fontSize: "clamp(14px, 4vw, 16px)", lineHeight: "1.6" }}
                >
                  {props.data ? props.data.paragraph : "Loading"}
                </p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
                  <Link to="/register" className="btn btn-custom btn-lg page-scroll">
                    Crear cuenta gratis
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-custom btn-lg page-scroll"
                    style={{ background: "transparent", color: "#fff", border: "2px solid #fff" }}
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
