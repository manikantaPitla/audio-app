import React from "react";
import { BlurContainer, HomeContainer } from "./styled-component";
import bgImage from "../../assets/images/nature.webp";
import AudioCard from "../../components/AudioCard";
import { useSearchParams } from "react-router-dom";

function Home() {

  const [searchParams, setSearchParams] = useSearchParams();
  console.log("Query Params: ",searchParams.get('q'))

  return (
    <HomeContainer style={{ backgroundImage: `url(${bgImage})` }}>
      <BlurContainer>
        <AudioCard />
      </BlurContainer>
    </HomeContainer>
  );
}

export default Home;
