import React from "react";
import { Link } from "react-router-dom";

export const Contact = (props) => {
  const data = props.data || {};

  return (
    <section id="contact" className="annie-section annie-section--alt contact-section">
      <div className="annie-section__inner contact-inner">
        <div className="contact-head">
          <div>
            <span className="annie-section__eyebrow">Comienza hoy</span>
            <h2 className="annie-section__title">Empieza a administrar tu negocio con <strong>Annie</strong></h2>
            <p className="annie-section__desc contact-intro">
              Crea tu cuenta en <strong>Annie</strong> y organiza tus ventas, clientes e inventario desde una sola plataforma.
            </p>
            <Link to="/register" className="contact-btn">
              <i className="fa fa-user-plus" style={{ marginRight: 8 }} />Crear cuenta gratis
            </Link>
          </div>
        </div>

        <div className="contact-grid">
          <div className="contact-card contact-card--info">
            <div className="contact-card__media">
              <img
                src="/img/about.jpg"
                alt="Emprendedores usando Annie"
                className="contact-card__media-img"
              />
            </div>
            <ul className="contact-card__support-list">
              <li>
                <span className="contact-card__icon"><i className="fa fa-envelope-o" aria-hidden="true" /></span>
                <span>{data.email || "info@annie.com"}</span>
              </li>
              <li>
                <span className="contact-card__icon"><i className="fa fa-phone" aria-hidden="true" /></span>
                <span>{data.phone || "+52 55 1234 5678"}</span>
              </li>
              <li>
                <span className="contact-card__icon"><i className="fa fa-facebook" aria-hidden="true" /></span>
                <span>Facebook</span>
              </li>
              <li>
                <span className="contact-card__icon"><i className="fa fa-twitter" aria-hidden="true" /></span>
                <span>Twitter</span>
              </li>
              <li>
                <span className="contact-card__icon"><i className="fa fa-youtube" aria-hidden="true" /></span>
                <span>YouTube</span>
              </li>
              <li>
                <span className="contact-card__icon"><i className="fa fa-instagram" aria-hidden="true" /></span>
                <span>Instagram</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bar">
        <div className="footer-bar__content">
          <span className="footer-brand">© 2026 Annie</span>
          <span className="footer-separator" aria-hidden="true">•</span>
          <span>Plataforma de gestión para pequeños negocios</span>
    | <a href="/AVISOPRIVACIDAD.pdf" target="_blank">Aviso de Privacidad</a>
        </div>
      </div>
    </section>
  );
};
