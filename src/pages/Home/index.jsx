import React from "react";
import { BlurContainer, HomeContainer } from "./styled-component";
import bgImage from "../../assets/images/nature.webp";
import AudioCard from "../../components/AudioCard";

function Home() {
  return (
    <HomeContainer style={{ backgroundImage: `url(${bgImage})` }}>
      <BlurContainer>
        <AudioCard />
      </BlurContainer>
    </HomeContainer>
  );
}

export default Home;
