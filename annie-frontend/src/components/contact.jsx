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
            <h2 className="annie-section__title">Empieza a administrar tu negocio con ANNIE</h2>
            <p className="annie-section__desc contact-intro">
              Crea tu cuenta en ANNIE y organiza tus ventas, clientes e inventario desde una sola plataforma.
            </p>
            <Link to="/register" className="contact-btn">
              <i className="fa fa-user-plus" style={{ marginRight: 8 }} />Crear cuenta gratis
            </Link>
          </div>
          <div className="contact-highlight">
            <span className="contact-highlight__label">Soporte de crecimiento</span>
            <p className="contact-highlight__text">Muy pronto añadiremos soporte directo y chat en vivo para emprendedores.</p>
          </div>
        </div>

        <div className="contact-grid">
          <div className="contact-card contact-card--info">
            <h3 className="contact-card__title">Información</h3>
            <p className="contact-card__text">{data.address || "Empieza a administrar tu negocio hoy."}</p>
            <ul className="contact-card__points">
              <li>Organiza ventas, clientes e inventarios desde un solo panel.</li>
              <li>Recibe reportes y alertas diseñadas para emprendedores.</li>
            </ul>
            <div className="contact-card__list">
              <div className="contact-card__item">
                <span className="contact-card__icon">
                  <i className="fa fa-envelope-o" />
                </span>
                <div>
                  <strong>Email</strong>
                  <div className="contact-card__value">{data.email || "info@annie.com"}</div>
                </div>
              </div>
              <div className="contact-card__item">
                <span className="contact-card__icon">
                  <i className="fa fa-phone" />
                </span>
                <div>
                  <strong>Teléfono</strong>
                  <div className="contact-card__value">{data.phone || "+52 55 1234 5678"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-card contact-card--social">
            <h3 className="contact-card__title">Síguenos</h3>
            <p className="contact-card__text">
              Mantente al día con las novedades de ANNIE y el ecosistema emprendedor.
            </p>
            <ul className="contact-card__points">
              <li>Consejos para negocios locales y ventas recurrentes.</li>
              <li>Actualizaciones de producto, eventos y recursos gratis.</li>
            </ul>
            <div className="social-links">
              <a href={data.facebook || "/"} target="_blank" rel="noreferrer" aria-label="Facebook">
                <i className="fa fa-facebook" />
              </a>
              <a href={data.twitter || "/"} target="_blank" rel="noreferrer" aria-label="Twitter">
                <i className="fa fa-twitter" />
              </a>
              <a href={data.youtube || "/"} target="_blank" rel="noreferrer" aria-label="YouTube">
                <i className="fa fa-youtube" />
              </a>
              <a href={data.instagram || "/"} target="_blank" rel="noreferrer" aria-label="Instagram">
                <i className="fa fa-instagram" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bar">
        <div className="footer-bar__content">
          <span className="footer-brand">© 2026 ANNIE</span>
          <span className="footer-separator" aria-hidden="true">•</span>
          <span>Plataforma de gestión para pequeños negocios</span>
        </div>
      </div>
    </section>
  );
};
