// src/components/About.js
function About() {
  return (
    <div id="about" className="about">
      <div className="container">
        <div className="row">
          {/* Texto */}
          <div className="col-md-5">
            <div className="titlepage">
              <h2>
                About <span className="green">Us</span>
              </h2>
              <p>
                There are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration in some form, by
                injected humour.
              </p>
              <a className="read_more" href="javascript:void(0)">
                Read More
              </a>
            </div>
          </div>
          {/* Imagen */}
          <div className="col-md-7">
            <div className="about_img">
              <figure>
                <img src="images/about.png" alt="About" />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
