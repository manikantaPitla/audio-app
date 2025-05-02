import React, { useState, useEffect, useRef } from "react";
import {
  AudioCardContainer,
  AudioCountBadge,
  AudioDisplaySection,
  AudioIconsContainer,
  AudioTitleSection,
  BackgroundCard,
} from "./styled-component";
import bgImage from "../../assets/images/mockup_playlist_cover.webp";
import {
  PlayIcon,
  PlaylistIcon,
  PauseIcon,
  PlayRightIcon,
  PlayLeftIcon,
} from "../../utils/svgIcons";

import audio_one from "../../assets/audios/calm_nature_sounds.mp3";
import audio_two from "../../assets/audios/gentle_rain_from_window.mp3";

const rawAudioList = [
  {
    title: "Forest Atmosohere",
    file: audio_one,
  },
  {
    title: "Morning Music",
    file: audio_two,
  },
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function AudioCard() {
  const [isAudioFilesVisible, setAudioFilesVisible] = useState(false);
  const [audioAction, setAudioAction] = useState("Play");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [durations, setDurations] = useState([]);

  const audioRef = useRef(null);

  useEffect(() => {
    const fetchDurations = async () => {
      const durationPromises = rawAudioList.map(
        (track) =>
          new Promise((resolve) => {
            const tempAudio = new Audio(track.file);
            tempAudio.addEventListener("loadedmetadata", () => {
              resolve(tempAudio.duration);
            });
          })
      );

      const loadedDurations = await Promise.all(durationPromises);
      setDurations(loadedDurations);
    };

    fetchDurations();
  }, []);

  const toggleAudio = () => {
    if (!isAudioFilesVisible) setAudioFilesVisible(true);

    if (audioAction === "Play") {
      audioRef.current.play();
      setAudioAction("Pause");
    } else {
      audioRef.current.pause();
      setAudioAction("Play");
    }
  };

  const playNext = () => {
    const nextIndex = (currentIndex + 1) % rawAudioList.length;
    setCurrentIndex(nextIndex);
    setAudioAction("Pause");
    setTimeout(() => {
      audioRef.current.play();
    }, 0);
  };

  const playPrev = () => {
    const prevIndex =
      (currentIndex - 1 + rawAudioList.length) % rawAudioList.length;
    setCurrentIndex(prevIndex);
    setAudioAction("Pause");
    setTimeout(() => {
      audioRef.current.play();
    }, 0);
  };

  const playSpecificTrack = (index) => {
    setCurrentIndex(index);
    setAudioAction("Pause");
    setTimeout(() => {
      audioRef.current.play();
    }, 0);
  };

  return (
    <AudioCardContainer>
      <BackgroundCard style={{ backgroundImage: `url(${bgImage})` }}>
        <audio ref={audioRef} src={rawAudioList[currentIndex].file} />

        <AudioCountBadge>
          <PlaylistIcon />
          <p>{rawAudioList.length}</p>
        </AudioCountBadge>

        <AudioIconsContainer>
          {audioAction === "Pause" && (
            <button type="button" onClick={playPrev}>
              <PlayLeftIcon />
            </button>
          )}
          <button type="button" onClick={toggleAudio}>
            {audioAction === "Play" ? <PlayIcon /> : <PauseIcon />}
          </button>
          {audioAction === "Pause" && (
            <button type="button" onClick={playNext}>
              <PlayRightIcon />
            </button>
          )}
        </AudioIconsContainer>
      </BackgroundCard>

      {isAudioFilesVisible && (
        <AudioDisplaySection>
          {rawAudioList.map((audio, index) => (
            <button key={index} onClick={() => playSpecificTrack(index)}>
              <p
                style={{
                  color: index === currentIndex ? "#007bff" : "white",
                  fontWeight: index === currentIndex ? "600" : "400",
                }}
              >
                {audio.title}
              </p>
              <span
                style={{ color: index === currentIndex ? "#007bff" : "white" }}
              >
                {durations[index] ? formatTime(durations[index]) : "Loading..."}
              </span>
            </button>
          ))}
        </AudioDisplaySection>
      )}

      <AudioTitleSection>
        <h2>TV Nose</h2>
        <p>Our first single</p>
      </AudioTitleSection>
    </AudioCardContainer>
  );
}

export default AudioCard;
