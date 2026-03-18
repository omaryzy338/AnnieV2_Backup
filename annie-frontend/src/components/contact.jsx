import React from "react";
import { Link } from "react-router-dom";

export const Contact = (props) => {
  return (
    <>
      <div id="contact">
        <div className="container">
          <div className="col-md-8">
            <div className="row">
              <div className="section-title">
                <h2>Empieza Hoy</h2>
                <p>
                  {props.data ? props.data.address : "Loading"}
                </p>
                <p>
                  {props.data ? props.data.phone : "Loading"}
                </p>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Link
                    to="/register"
                    className="btn btn-custom btn-lg"
                  >
                    Registrarse
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link
                    to="/login"
                    className="btn btn-custom btn-lg"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-md-offset-1 contact-info">
            <div className="contact-item">
              <h3>Información</h3>
              <p>
                <span>
                  <i className="fa fa-envelope-o"></i> Email
                </span>{" "}
                {props.data ? props.data.email : "loading"}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-facebook"></i> Facebook
                </span>{" "}
                <a href={props.data ? props.data.facebook : "/"}>
                  {props.data ? props.data.facebook : "loading"}
                </a>
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-twitter"></i> Twitter
                </span>{" "}
                <a href={props.data ? props.data.twitter : "/"}>
                  {props.data ? props.data.twitter : "loading"}
                </a>
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-youtube"></i> YouTube
                </span>{" "}
                <a href={props.data ? props.data.youtube : "/"}>
                  {props.data ? props.data.youtube : "loading"}
                </a>
              </p>
            </div>
          </div>
          <div className="col-md-12">
            <div className="row">
              <div className="social">
                <ul>
                  <li>
                    <a href={props.data ? props.data.facebook : "/"}>
                      <i className="fa fa-facebook"></i>
                    </a>
                  </li>
                  <li>
                    <a href={props.data ? props.data.twitter : "/"}>
                      <i className="fa fa-twitter"></i>
                    </a>
                  </li>
                  <li>
                    <a href={props.data ? props.data.youtube : "/"}>
                      <i className="fa fa-youtube"></i>
                    </a>
                  </li>
                </ul>
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
