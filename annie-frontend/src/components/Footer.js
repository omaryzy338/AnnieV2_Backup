// src/components/Footer.js
function Footer() {
  return (
    <footer>
      <div className="footer">
        <div className="container">
          <div className="row">
            {/* Redes sociales */}
            <div className="col-md-3 col-sm-6">
              <ul className="social_icon">
                <li><a href="#"><i className="fa fa-facebook" aria-hidden="true"></i></a></li>
                <li><a href="#"><i className="fa fa-twitter" aria-hidden="true"></i></a></li>
                <li><a href="#"><i className="fa fa-linkedin" aria-hidden="true"></i></a></li>
                <li><a href="#"><i className="fa fa-instagram" aria-hidden="true"></i></a></li>
              </ul>
              <p className="variat pad_roght2">
                There are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration in some form.
              </p>
            </div>

            {/* Let us help you */}
            <div className="col-md-3 col-sm-6">
              <h3>LET US HELP YOU</h3>
              <p className="variat pad_roght2">
                There are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration in some form.
              </p>
            </div>

            {/* Information */}
            <div className="col-md-3 col-sm-6">
              <h3>INFORMATION</h3>
              <ul className="link_menu">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="service.html">Services</a></li>
                <li><a href="gallery.html">Gallery</a></li>
                <li><a href="testimonial.html">Testimonial</a></li>
                <li><a href="contact.html">Contact Us</a></li>
              </ul>
            </div>

            {/* Our Design */}
            <div className="col-md-3 col-sm-6">
              <h3>OUR Design</h3>
              <p className="variat">
                There are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration in some form.
              </p>
            </div>

            {/* Suscripción */}
            <div className="col-md-6 offset-md-6">
              <form id="hkh" className="bottom_form">
                <input
                  className="enter"
                  placeholder="Enter your email"
                  type="text"
                  name="email"
                />
                <button className="sub_btn">Subscribe</button>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="copyright">
          <div className="container">
            <div className="row">
              <div className="col-md-10 offset-md-1">
                <p>
                  © 2019 All Rights Reserved. Design by{" "}
                  <a href="https://html.design/">Free Html Templates</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
