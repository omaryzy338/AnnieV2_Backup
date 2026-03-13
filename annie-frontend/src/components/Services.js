// src/components/Services.js
function Services() {
  return (
    <div id="service" className="service">
      <div className="container">
        <div className="row">
          {/* Título */}
          <div className="col-md-12">
            <div className="titlepage">
              <h2>
                Our <span className="green">Services</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Bloques de servicios */}
        <div className="row">
          <div className="col-md-10 offset-md-1">
            <div className="row">
              {/* Servicio 1 */}
              <div className="col-md-4 col-sm-6">
                <div className="service_box">
                  <i><img src="images/service1.png" alt="Service 1" /></i>
                  <h3>Retina Ready</h3>
                  <p>Many variations of passages <br />of Lorem Ipsum available,</p>
                </div>
              </div>

              {/* Servicio 2 */}
              <div className="col-md-4 offset-md-1 col-sm-6">
                <div className="service_box">
                  <i><img src="images/service2.png" alt="Service 2" /></i>
                  <h3>Creative Elements</h3>
                  <p>Many variations of passages <br />of Lorem Ipsum available,</p>
                </div>
              </div>

              {/* Servicio 3 */}
              <div className="col-md-4 offset-md-3 col-sm-6 mar_top">
                <div className="service_box">
                  <i><img src="images/service3.png" alt="Service 3" /></i>
                  <h3>Easy-to-Use</h3>
                  <p>Many variations of passages <br />of Lorem Ipsum available,</p>
                </div>
              </div>

              {/* Servicio 4 */}
              <div className="col-md-4 offset-md-1 col-sm-6 mar_top">
                <div className="service_box">
                  <i><img src="images/service4.png" alt="Service 4" /></i>
                  <h3>Easy Import</h3>
                  <p>Many variations of passages <br />of Lorem Ipsum available,</p>
                </div>
              </div>

              {/* Botón Read More */}
              <div className="col-md-12">
                <a className="read_more" href="javascript:void(0)">Read More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Services;
