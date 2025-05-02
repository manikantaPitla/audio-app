import styled from "styled-components";

export const HomeContainer = styled.div`
  height: 100vh;
  width: 100vw;
  background-size: cover;
  background-position: center;
`;

export const BlurContainer = styled.div`
  height: inherit;
  width: inherit;
  backdrop-filter: blur(15px) !important;
  background-color: rgba(0,0,0,0.2);
  display: flex;
  justify-content: center;
`;
