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
          <Link className="navbar-brand page-scroll" to="/">
            Annie
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
              <a href="#team" className="page-scroll">
                Team
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
          </ul>
        </div>
      </div>
    </nav>
  );
};