import { Image } from "./image";
import React from "react";

export const Gallery = (props) => {
  return (
    <div id="portfolio" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Tecnologías Utilizadas</h2>
          <p>
            Annie está construido con el stack tecnológico más moderno y fiable para garantizar rendimiento, seguridad y escalabilidad.
          </p>
        </div>
        <div className="row" style={{ marginTop: "40px" }}>
          <div className="portfolio-items">
            {props.data
              ? props.data.map((d, i) => (
                  <div
                    key={`${d.title}-${i}`}
                    className="col-xs-12 col-sm-6 col-md-4 col-lg-4"
                    style={{ paddingTop: "20px", paddingBottom: "20px" }}
                  >
                    <a href={d.url || d.largeImage} target="_blank" rel="noreferrer" aria-label={`Abrir ${d.title}`}> 
                      <Image
                        title={d.title}
                        largeImage={d.largeImage}
                        smallImage={d.smallImage}
                      />
                      <div className="portfolio-label">{d.title}</div>
                    </a>
                  </div>
                ))
              : "Loading..."}
          </div>
        </div>
      </div>
    </div>
  );
};
