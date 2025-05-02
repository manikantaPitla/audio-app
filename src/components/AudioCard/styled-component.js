import styled from "styled-components";

export const AudioCardContainer = styled.div`
  margin-top: 10px;
  background-color: #104911 ;
  color: #fff;
  height: fit-content;
`;
export const BackgroundCard = styled.div`
  width: 360px;
  height: 360px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  background-size: cover;
  background-position: center;
`;

export const AudioIconsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 50px;

  button {
    background-color: transparent;
    border: none;
    outline: none;
    color: inherit;
    cursor: pointer;
  }
`;

export const AudioCountBadge = styled.div`
  background-color: #008000;
  border-radius: 4px;
  padding: 8px;
  position: absolute;
  z-index: 5;
  top: 32px;
  left: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AudioDisplaySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;

  button {
    background-color: #006400;
    width: 100%;
    display: flex;
    -webkit-box-pack: justify;
    justify-content: space-between;
    -webkit-box-align: center;
    align-items: center;
    padding: 16px 20px;
    min-height: 56px;
    cursor: pointer;
    transition: 0.2s ease-in-out;
    color: #fff;
    border: none;
    font-weight: 700;
  }
`;

export const AudioTitleSection = styled.div`
  text-align: center;
  padding: 32px;

  h2 {
    font-size: 22px;
    margin-bottom: 10px;
  }

  p {
    font-size: 13px;
  }
`;
