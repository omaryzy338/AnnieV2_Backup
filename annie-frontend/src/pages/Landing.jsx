import React, { useState, useEffect } from "react";
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
import JsonData from "../data/data.json";

const Landing = () => {
  const [landingPageData, setLandingPageData] = useState({});
  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <>
      <Navigation />
      <Header data={landingPageData.Header} />
      <Features data={landingPageData.Features} />
      <About data={landingPageData.About} />
      <Services data={landingPageData.Services} />
      <Gallery data={landingPageData.Gallery} />
      <Testimonials data={landingPageData.Testimonials} />
      <Contact data={landingPageData.Contact} />
    </>
  );
};

export default Landing;
