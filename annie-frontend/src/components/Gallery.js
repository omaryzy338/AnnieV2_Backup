// src/components/Gallery.js
function Gallery() {
  return (
    <div id="gallery" className="gallery">
      <div className="container">
        <div className="row">
          {/* Título */}
          <div className="col-md-12">
            <div className="titlepage">
              <h2>
                Our <span className="green">Gallery</span>
              </h2>
              <p>
                Here are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration.
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="row">
          {/* Texto */}
          <div className="col-md-4 col-sm-6">
            <div className="gallery_text">
              <div className="galleryh3">
                <h3>Interior Design</h3>
                <p>
                  of passages of Lorem <br />
                  Ipsum available <br />
                  , but the majority <br />
                  have suffer
                </p>
              </div>
            </div>
          </div>

          {/* Imágenes */}
          <div className="col-md-4 col-sm-6">
            <div className="gallery_img">
              <figure><img src="images/gallery1.jpg" alt="Gallery 1" /></figure>
            </div>
          </div>
          <div className="col-md-4 col-sm-6">
            <div className="gallery_img">
              <figure><img src="images/gallery2.jpg" alt="Gallery 2" /></figure>
            </div>
          </div>
          <div className="col-md-4 col-sm-6">
            <div className="gallery_img">
              <figure><img src="images/gallery3.jpg" alt="Gallery 3" /></figure>
            </div>
          </div>
          <div className="col-md-4 col-sm-6">
            <div className="gallery_img">
              <figure><img src="images/gallery4.jpg" alt="Gallery 4" /></figure>
            </div>
          </div>

          {/* Más texto */}
          <div className="col-md-4 col-sm-6">
            <div className="gallery_text">
              <div className="galleryh3">
                <h3>Interior Design</h3>
                <p>
                  of passages of Lorem <br />
                  Ipsum available <br />
                  , but the majority <br />
                  have suffer
                </p>
              </div>
            </div>
          </div>

          {/* Más imágenes */}
          <div className="col-md-4 col-sm-6">
            <div className="gallery_text">
              <div className="galleryh3">
                <h3>Interior Design</h3>
                <p>
                  of passages of Lorem <br />
                  Ipsum available <br />
                  , but the majority <br />
                  have suffer
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-sm-6">
            <div className="gallery_img">
              <figure><img src="images/gallery5.jpg" alt="Gallery 5" /></figure>
            </div>
          </div>
          <div className="col-md-4 col-sm-6">
            <div className="gallery_img">
              <figure><img src="images/gallery6.jpg" alt="Gallery 6" /></figure>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;
