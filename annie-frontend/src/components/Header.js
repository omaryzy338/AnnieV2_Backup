// src/components/Header.js
function Header() {
  return (
    <header>
      <div className="header">
        <div className="container">
          <div className="row">
            {/* Logo */}
            <div className="col-md-12 col-sm-3 col logo_section">
              <div className="full">
                <div className="center-desk">
                  <div className="logo">
                    <a href="index.html">
                      <img src="images/logo.png" alt="Logo" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {/* Navbar */}
            <div className="col-md-10 offset-md-1">
              <nav className="navigation navbar navbar-expand-md navbar-dark">
                <button
                  className="navbar-toggler"
                  type="button"
                  data-toggle="collapse"
                  data-target="#navbarsExample04"
                  aria-controls="navbarsExample04"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarsExample04">
                  <ul className="navbar-nav mr-auto">
                    <li className="nav-item active"><a className="nav-link" href="index.html">Home</a></li>
                    <li className="nav-item"><a className="nav-link" href="about.html">About</a></li>
                    <li className="nav-item"><a className="nav-link" href="service.html">Services</a></li>
                    <li className="nav-item"><a className="nav-link" href="gallery.html">Gallery</a></li>
                    <li className="nav-item"><a className="nav-link" href="testimonial.html">Testimonial</a></li>
                    <li className="nav-item"><a className="nav-link" href="contact.html">Contact Us</a></li>
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
