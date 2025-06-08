import React, { useEffect, useState } from "react";
import { BlurContainer, HomeContainer } from "./styled-component";
import AudioCard from "../../components/AudioCard";
import { useSearchParams } from "react-router-dom";

// ---------------audio imports-----------------------
import birds_chirping from "../../assets/audios/Early-morning-in-greens/birds_chirping.mp3";
import running_stream from "../../assets/audios/Early-morning-in-greens/running_stream.mp3";

import night from '../../assets/audios/Midnight-Serenity/NIGHT.mp3'
import sound_night from '../../assets/audios/Midnight-Serenity/SOUNDNIGHT.mp3'
import thunder from '../../assets/audios/Midnight-Serenity/THUNDER.mp3'

import gentle_rain_from_window from '../../assets/audios/Rainy-window/gentle-rain-from-window.mp3';
import rain_in_evening from '../../assets/audios/Rainy-window/rain-in-evening.mp3';

import airflow from '../../assets/audios/Stillness/airflow.mp3'
import baby_laughing from '../../assets/audios/Stillness/BABY-LAUGHING.mp3'
import ocean_waves from '../../assets/audios/Stillness/OCEAN-WAVES.mp3'
import singing_bowls from '../../assets/audios/Stillness/SINGING-BOWLS.mp3'
import under_water from '../../assets/audios/Stillness/UNDERWATER.mp3'

// ---------------image imports-----------------------

import early_morning_in_greens_img from '../../assets/pics/EARLY_MORNING_IN_GREENS.jpg'
import golden_hour_img from '../../assets/pics/GOLDEN_HOUR.jpg'
import mid_night_img from '../../assets/pics/MIDNIGHT.jpg'
import rainy_window_img from '../../assets/pics/RAINY_WINDOW.jpg'
import stillness_img from '../../assets/pics/STILLNESS.jpg'


const audioData = [
  {
    id: "early-morning-in-greens",
    albumName: "Early morning in greens",
    subTitle: "Stillness of Awakening",
    albumImage: early_morning_in_greens_img,
    colors: {
      primary: "#FDEE8B",
      secondary: "#D3E280",
      text: "#006400",
      textDefault: "#6d6a75",
      titleColor: "#245501"
    },
    audioFiles: [{
      name: "Birds Chirping",
      file: birds_chirping
    }, {
      name: "Running Stream",
      file: running_stream
    }]
  },
  {
    id: "golden-hour-glow",
    albumName: "Golden hour glow",
    subTitle: "Our first single",
    albumImage: golden_hour_img,
    colors: {
      primary: "#402b6e",
      secondary: "#d7a4e4",
      text: "#402b6e",
      textDefault: "#ffffff",
      titleColor: "#ffffff"

    },
    audioFiles: [

    ]
  },
  {
    id: "mid-night-sernity",
    albumName: "Midnight Serenity",
    subTitle: "Stillness of surrender",
    albumImage: mid_night_img,
    colors: {
      secondary: "#262262",
      primary: "#000017",
      text: "#ffffff",
      textDefault: "#6c757d",
      titleColor: "#ffffff"

    },
    audioFiles: [{
      name: "Night",
      file: night
    },
    {
      name: "Sound Night",
      file: sound_night
    },
    {
      name: "Thunder",
      file: thunder
    },]
  },
  {
    id: "rainy-window",
    albumName: "Rainy window",
    subTitle: "Stillness of Longing",
    albumImage: rainy_window_img,
    colors: {
      primary: "#1B3558",
      secondary: "#ABCFE8",
      text: "#1B3558",
      textDefault: "#495057",
      titleColor: "#ffffff"

    },
    audioFiles: [{
      name: "Gentle rain from window",
      file: gentle_rain_from_window
    }, {
      name: "Rain in evening",
      file: rain_in_evening
    }]
  },
  {
    id: "stillness",
    albumName: "Stillness",
    subTitle: "our first single",
    albumImage: stillness_img,
    colors: {
      primary: "#000017",
      secondary: "#ececed",
      text: "#000017",
      textDefault: "#6c757d ",
      titleColor: "#ffffff"

    },
    audioFiles: [
      {
        name: "Airflow",
        file: airflow
      },
      {
        name: "Baby Laughing",
        file: baby_laughing
      },
      {
        name: "Ocean Waves",
        file: ocean_waves
      },
      {
        name: "Singing Bowls",
        file: singing_bowls
      },
      {
        name: "Underwater",
        file: under_water
      },
    ]
  },
]

function Home() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [album, setAlbum] = useState(null);
  console.log("Albumn: ", album)

  useEffect(() => {
    const albumData = query
      ? audioData.find(alb => alb.id.toLowerCase() === query.toLowerCase())
      : audioData[0];

    console.log("alb", albumData)
    setAlbum(albumData || audioData[0]);
  }, [query]);

  return (
    <HomeContainer style={{ backgroundImage: `url(${album?.albumImage})` }}>
      <BlurContainer>
        {album && <AudioCard album={album} />}
      </BlurContainer>
    </HomeContainer >
  );
}

export default Home;

