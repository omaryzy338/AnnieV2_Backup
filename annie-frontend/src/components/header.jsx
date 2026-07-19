import React from "react";
import { Link } from "react-router-dom";

export const Header = (props) => {
  const heroImageUrl = `${process.env.PUBLIC_URL || ""}/img/hero-guided.jpg`;

  return (
    <header
      id="header"
      style={{
        backgroundColor: "#0b162a",
        // El degradado va aquí (no en .overlay) para que cubra TODO el header
        // de forma pareja; si no, se marca una costura donde termina el padding.
        backgroundImage: `linear-gradient(rgba(11, 22, 42, 0.55), rgba(11, 22, 42, 0.55)), url(${heroImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
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
                <div className="annie-hero-actions">
                  <Link to="/register" className="btn-custom annie-hero-btn">
                    Crear cuenta
                  </Link>
                  <Link to="/login" className="btn-custom annie-hero-btn annie-hero-btn--secondary">
                    Entrar
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
