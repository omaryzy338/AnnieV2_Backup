// src/components/Banner.js
function Banner() {
  return (
    <section className="banner_main">
      <div id="myCarousel" className="carousel slide banner" data-ride="carousel">
        {/* Indicadores */}
        <ol className="carousel-indicators">
          <li data-target="#myCarousel" data-slide-to="0" className="active"></li>
          <li data-target="#myCarousel" data-slide-to="1"></li>
          <li data-target="#myCarousel" data-slide-to="2"></li>
        </ol>

        {/* Slides */}
        <div className="carousel-inner">
          {[...Array(3)].map((_, i) => (
            <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={i}>
              <div className="container">
                <div className="carousel-caption relative">
                  <div className="row">
                    <div className="col-md-7 offset-md-5">
                      <div className="text-bg">
                        <h1>Design <br />Of Furniture</h1>
                        <span>There are many variations of passages of Lorem Ipsum available</span>
                        <a className="read_more" href="javascript:void(0)">Read More</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controles */}
        <a className="carousel-control-prev" href="#myCarousel" role="button" data-slide="prev">
          <i className="fa fa-angle-left" aria-hidden="true"></i>
          <span className="sr-only">Previous</span>
        </a>
        <a className="carousel-control-next" href="#myCarousel" role="button" data-slide="next">
          <i className="fa fa-angle-right" aria-hidden="true"></i>
          <span className="sr-only">Next</span>
        </a>
      </div>
    </section>
  );
}

export default Banner;
