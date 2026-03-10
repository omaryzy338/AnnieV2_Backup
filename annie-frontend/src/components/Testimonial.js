// src/components/Testimonial.js
function Testimonial() {
  return (
    <div id="testimonial" className="Testimonial">
      <div className="container-fluid">
        <div className="row d_flex">
          {/* Carrusel */}
          <div className="col-md-8 pad_left0">
            <div id="testimon" className="carousel slide banner_testimonial" data-ride="carousel">
              {/* Indicadores */}
              <ol className="carousel-indicators">
                <li data-target="#testimon" data-slide-to="0" className="active"></li>
                <li data-target="#testimon" data-slide-to="1"></li>
                <li data-target="#testimon" data-slide-to="2"></li>
              </ol>

              {/* Slides */}
              <div className="carousel-inner">
                {[...Array(3)].map((_, i) => (
                  <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={i}>
                    <div className="container">
                      <div className="carousel-caption relative">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="text_humai">
                              <i><img src="images/tett1.png" alt="Testimonial 1" /></i>
                              <span>HumouThere</span>
                              <p>
                                T suffered alteration in some form, by injected humour.
                                There are many variations of passages of Lorem Ipsum available,
                                but the majority have suffered alteration.
                              </p>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="text_humai">
                              <i><img src="images/tett2.png" alt="Testimonial 2" /></i>
                              <span>HumouThere</span>
                              <p>
                                T suffered alteration in some form, by injected humour.
                                There are many variations of passages of Lorem Ipsum available,
                                but the majority have suffered alteration.
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
              <a className="carousel-control-prev" href="#testimon" role="button" data-slide="prev">
                <i className="fa fa-angle-left" aria-hidden="true"></i>
                <span className="sr-only">Previous</span>
              </a>
              <a className="carousel-control-next" href="#testimon" role="button" data-slide="next">
                <i className="fa fa-angle-right" aria-hidden="true"></i>
                <span className="sr-only">Next</span>
              </a>
            </div>
          </div>

          {/* Título lateral */}
          <div className="col-md-4">
            <div className="titlepage">
              <h2>Testimonial</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testimonial;
