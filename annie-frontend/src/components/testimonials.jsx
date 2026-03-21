import React from "react";

export const Testimonials = (props) => {
  return (
    <div id="testimonials">
      <div className="container">
        <div className="section-title text-center">
          <h2>Testimonios e Insights</h2>
          <p>Descubre los principales desafíos que enfrenta el ecosistema emprendedor actual</p>
        </div>
        <div className="row" style={{ marginTop: "40px" }}>
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-xs-12 col-sm-6 col-md-4" style={{ marginBottom: "30px" }}>
                  <div 
                    className="testimonial"
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      padding: "clamp(16px, 4vw, 24px)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div 
                      className="testimonial-image"
                      style={{
                        marginBottom: "16px",
                        display: "flex",
                        justifyContent: "center"
                      }}
                    >
                      <img 
                        src={d.img} 
                        alt={d.name}
                        style={{
                          width: "clamp(60px, 15vw, 80px)",
                          height: "clamp(60px, 15vw, 80px)",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid #6372ff"
                        }}
                      />
                    </div>
                    <div className="testimonial-content" style={{ flex: 1 }}>
                      <p style={{ color: "#666", lineHeight: "1.6", fontStyle: "italic", marginBottom: "16px", fontSize: "clamp(12px, 2.5vw, 14px)" }}>
                        {d.text}
                      </p>
                      <div className="testimonial-meta" style={{ color: "#6372ff", fontWeight: "600", fontSize: "clamp(12px, 2vw, 14px)" }}>
                        {d.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : "loading"}
        </div>
      </div>
    </div>
  );
};
