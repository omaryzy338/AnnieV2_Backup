import React from "react";

export const Header = (props) => {
  return (
    <header
      id="header"
      style={{
        backgroundImage: "url('/img/intro-bp.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        paddingTop: "min(140px, 20vw)",
      }}
    >
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-xs-12 col-md-8 col-md-offset-2 intro-text">
                <h1 
                  className="header-title" 
                  style={{ marginBottom: "20px" }}
                >
                  {props.data ? props.data.title : "Loading"}
                </h1>
                <p 
                  className="header-paragraph" 
                  style={{ marginBottom: "40px", fontSize: "clamp(14px, 4vw, 16px)", lineHeight: "1.6" }}
                >
                  {props.data ? props.data.paragraph : "Loading"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
