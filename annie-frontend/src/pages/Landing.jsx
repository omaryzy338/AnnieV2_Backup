import React from "react";
import {
  Navigation,
  Header,
  Features,
  About,
  Services,
  Gallery,
  Testimonials,
  Contact,
} from "../components";
// Textos de la página principal (contenido estático, viene en el bundle)
import JsonData from "../data/data.json";

const Landing = () => {
  return (
    <>
      <Navigation />
      <Header data={JsonData.Header} />
      <Features data={JsonData.Features} />
      <About data={JsonData.About} />
      <Services data={JsonData.Services} />
      <Gallery data={JsonData.Gallery} />
      <Testimonials data={JsonData.Testimonials} />
      <Contact data={JsonData.Contact} />
    </>
  );
};

export default Landing;
