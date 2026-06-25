import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Navigation = (props) => {
  const [isLogged, setIsLogged] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogged(!!localStorage.getItem("token"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLogged(false);
    navigate("/");
    window.location.reload();
  };

  const navItems = [
    { href: "/", icon: "logo", label: "Inicio", external: false },
    { href: "#about", icon: "fa fa-lightbulb-o", label: "Propuesta", external: true },
    { href: "#services", icon: "fa fa-cogs", label: "Funciones", external: true },
    { href: "#portfolio", icon: "fa fa-code", label: "Tecnología", external: true },
    { href: "#testimonials", icon: "fa fa-comments", label: "Voces", external: true },
    { href: "#contact", icon: "fa fa-envelope", label: "Contacto", external: true },
  ];

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top annie-nav">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
        </div>

        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
          <ul className="nav navbar-nav navbar-right annie-nav__links">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.external ? (
                  <a href={item.href} className="page-scroll annie-nav__link">
                    {item.icon === "logo" ? (
                      <img src="/favicon.png" alt="ANNIE" className="annie-nav__item-logo" />
                    ) : (
                      <i className={item.icon} aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link to={item.href} className="annie-nav__link">
                    {item.icon === "logo" ? (
                      <img src="/favicon.png" alt="ANNIE" className="annie-nav__item-logo" />
                    ) : (
                      <i className={item.icon} aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}

            {isLogged ? (
              <li>
                <Link to="/dashboard" className="annie-nav__cta annie-nav__link">
                  <i className="fa fa-th-large" aria-hidden="true" />
                  <span>Mi panel</span>
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login" className="annie-nav__link">
                    <i className="fa fa-sign-in" aria-hidden="true" />
                    <span>Entrar</span>
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="annie-nav__link annie-nav__cta-link">
                    <span>Crear cuenta</span>
                  </Link>
                </li>
              </>
            )}

            {isLogged && (
              <li>
                <a onClick={handleLogout} className="annie-nav__link" style={{ cursor: "pointer" }}>
                  <i className="fa fa-sign-out" aria-hidden="true" />
                  <span>Salir</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};
