import React from "react";

export const Image = ({ title, largeImage, smallImage }) => {
  return (
    <div className="portfolio-item">
      <div className="hover-bg" style={{ minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa", borderRadius: "8px", transition: "all 0.3s ease" }}>
        <a 
          href={largeImage} 
          title={title} 
          data-lightbox-gallery="gallery1"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", textDecoration: "none" }}
        >
          <div 
            className="hover-text" 
            style={{ position: "absolute", zIndex: 2, textAlign: "center", opacity: 0, transition: "all 0.3s ease" }}
          >
            <h4 style={{ color: "#fff", margin: 0, fontWeight: "600" }}>{title}</h4>
          </div>
          <img
            src={smallImage}
            className="img-responsive"
            alt={title}
            style={{
              width: "90px",
              height: "90px",
              objectFit: "contain",
              filter: "grayscale(20%)",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => e.target.style.filter = "grayscale(0%)"}
            onMouseOut={(e) => e.target.style.filter = "grayscale(20%)"}
          />
        </a>
      </div>
    </div>
  );
};
