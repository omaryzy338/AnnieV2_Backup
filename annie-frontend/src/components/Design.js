// src/components/Design.js
function Design() {
  return (
    <div className="design">
      <div className="container-fluid">
        <div className="row d_flex">
          {/* Carrusel de texto */}
          <div className="col-md-5">
            <div id="design" className="carousel slide banner_design" data-ride="carousel">
              {/* Indicadores */}
              <ol className="carousel-indicators">
                <li data-target="#design" data-slide-to="0" className="active"></li>
                <li data-target="#design" data-slide-to="1"></li>
                <li data-target="#design" data-slide-to="2"></li>
              </ol>

              {/* Slides */}
              <div className="carousel-inner">
                {[...Array(3)].map((_, i) => (
                  <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={i}>
                    <div className="container">
                      <div className="carousel-caption relative">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="text_de">
                              <div className="titlepage">
                                <h2>
                                  New Ideas <span className="green">Design</span>
                                </h2>
                              </div>
                              <p>
                                There are many variations of passages of Lorem Ipsum available,
                                but the majority have suffered alteration in some form.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles */}
              <a className="carousel-control-prev" href="#design" role="button" data-slide="prev">
                <i className="fa fa-angle-left" aria-hidden="true"></i>
                <span className="sr-only">Previous</span>
              </a>
              <a className="carousel-control-next" href="#design" role="button" data-slide="next">
                <i className="fa fa-angle-right" aria-hidden="true"></i>
                <span className="sr-only">Next</span>
              </a>
            </div>
          </div>

          {/* Imagen lateral */}
          <div className="col-md-7 pad_roght0">
            <div className="design_img">
              <figure>
                <img src="images/desi.jpg" alt="Design" />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Design;
