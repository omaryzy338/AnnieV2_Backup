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
    setIsLogged(false);
    navigate("/");
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
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
          <Link className="navbar-brand page-scroll" to="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#6372ff"/>
              <text x="16" y="22" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial">A</text>
            </svg>
            <span style={{ fontWeight: "600", fontSize: "18px" }}>ANNIE</span>
          </Link>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <a href="#features" className="page-scroll">
                Desafios
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll">
                que somos
              </a>
            </li>
            <li>
              <a href="#services" className="page-scroll">
                Funcionalidades
              </a>
            </li>
            <li>
              <a href="#portfolio" className="page-scroll">
                Tecnologias
              </a>
            </li>
            <li>
              <a href="#testimonials" className="page-scroll">
                Testimonios
              </a>
            </li>
            <li>
              <a href="#contact" className="page-scroll">
                Contact
              </a>
            </li>
            {isLogged ? (
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
            {isLogged && (
              <li>
                <a onClick={handleLogout} style={{ cursor: "pointer" }}>
                  Logout
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};