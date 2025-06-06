import React, { useState, useEffect, useRef } from "react";
import {
  AudioCardContainer,
  AudioCountBadge,
  AudioDisplaySection,
  AudioIconsContainer,
  AudioTitleSection,
  BackgroundCard,
  AudioRangeTrackContainer,
  AudioRangeTrackProgress,
} from "./styled-component";
import {
  PlayIcon,
  PlaylistIcon,
  PauseIcon,
  PlayRightIcon,
  PlayLeftIcon,
} from "../../utils/svgIcons";

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return "00:00";

  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function AudioCard({ album }) {
  const [isAudioFilesVisible, setAudioFilesVisible] = useState(false);
  const [audioAction, setAudioAction] = useState("Play");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [durations, setDurations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState([]);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(null);
  const audioObjectsRef = useRef([]);

  useEffect(() => {
    if (!album?.audioFiles || album.audioFiles.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    setDurations([]);
    setLoadingStates(Array(album.audioFiles.length).fill(true));
    setCurrentTime(0);

    const newLoadingStates = [...loadingStates];

    const fetchDurations = async () => {
      try {
        const newDurations = Array(album.audioFiles.length).fill(0);

        audioObjectsRef.current.forEach(audio => {
          audio.removeAttribute("src");
          audio.load();
        });
        audioObjectsRef.current = [];

        album.audioFiles.forEach((track, index) => {
          const tempAudio = new Audio();

          tempAudio.addEventListener("loadedmetadata", () => {
            newDurations[index] = tempAudio.duration;
            newLoadingStates[index] = false;
            setDurations([...newDurations]);
            setLoadingStates([...newLoadingStates]);

            if (!newLoadingStates.some(state => state)) {
              setIsLoading(false);
            }
          });

          tempAudio.addEventListener("error", (e) => {
            console.error(`Error loading audio file ${track.name}:`, e);
            newLoadingStates[index] = false;
            setLoadingStates([...newLoadingStates]);
            setError(`Failed to load some audio files. Please try again later.`);

            if (!newLoadingStates.some(state => state)) {
              setIsLoading(false);
            }
          });

          tempAudio.src = track.file;
          tempAudio.preload = "metadata";

          audioObjectsRef.current.push(tempAudio);
        });
      } catch (err) {
        console.error("Error fetching audio durations:", err);
        setError("Failed to load audio information. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchDurations();

    return () => {
      audioObjectsRef.current.forEach(audio => {
        audio.removeAttribute("src");
        audio.load();
      });
      audioObjectsRef.current = [];
    };
    // eslint-disable-next-line
  }, [album]);

  useEffect(() => {
    const handleAudioEnd = () => {
      playNext();
    };

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener("ended", handleAudioEnd);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("ended", handleAudioEnd);
      }
    };
    // eslint-disable-next-line
  }, [currentIndex, album?.audioFiles?.length]);

  useEffect(() => {
    const audioElement = audioRef.current;
    let timeUpdateInterval;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    if (audioElement) {
      audioElement.addEventListener("timeupdate", handleTimeUpdate);

      if (audioAction === "Pause") {
        timeUpdateInterval = setInterval(() => {
          setCurrentTime(audioElement.currentTime);
        }, 250);
      }
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      }
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
    };
  }, [audioAction, currentIndex]);

  const toggleAudio = () => {
    if (!isAudioFilesVisible) setAudioFilesVisible(true);

    try {
      if (audioAction === "Play") {
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAudioAction("Pause");
            })
            .catch(error => {
              console.error("Playback failed:", error);
              setError("Playback failed. Please try again.");
            });
        }
      } else {
        audioRef.current.pause();
        setAudioAction("Play");
      }
    } catch (err) {
      console.error("Error toggling audio:", err);
      setError("Playback error. Please try again.");
    }
  };

  const playNext = () => {
    if (!album?.audioFiles || album.audioFiles.length === 0) return;

    const nextIndex = (currentIndex + 1) % album.audioFiles.length;
    setCurrentIndex(nextIndex);
    setCurrentTime(0);

    if (audioAction === "Pause") {
      setTimeout(() => {
        try {
          const playPromise = audioRef.current.play();

          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Playback failed:", error);
              setError("Playback failed. Please try again.");
              setAudioAction("Play");
            });
          }
        } catch (err) {
          console.error("Error playing next track:", err);
          setError("Playback error. Please try again.");
          setAudioAction("Play");
        }
      }, 0);
    }
  };

  const playPrev = () => {
    if (!album?.audioFiles || album.audioFiles.length === 0) return;

    const prevIndex = (currentIndex - 1 + album.audioFiles.length) % album.audioFiles.length;
    setCurrentIndex(prevIndex);
    setCurrentTime(0);

    if (audioAction === "Pause") {
      setTimeout(() => {
        try {
          const playPromise = audioRef.current.play();

          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Playback failed:", error);
              setError("Playback failed. Please try again.");
              setAudioAction("Play");
            });
          }
        } catch (err) {
          console.error("Error playing previous track:", err);
          setError("Playback error. Please try again.");
          setAudioAction("Play");
        }
      }, 0);
    }
  };

  const playSpecificTrack = (index) => {
    if (!album?.audioFiles || index < 0 || index >= album.audioFiles.length) return;

    setCurrentIndex(index);
    setCurrentTime(0);

    setTimeout(() => {
      try {
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAudioAction("Pause");
            })
            .catch(error => {
              console.error("Playback failed:", error);
              setError("Playback failed. Please try again.");
              setAudioAction("Play");
            });
        }
      } catch (err) {
        console.error("Error playing specific track:", err);
        setError("Playback error. Please try again.");
        setAudioAction("Play");
      }
    }, 0);
  };

  const calculateProgress = () => {
    if (!durations[currentIndex] || durations[currentIndex] === 0) return 0;
    return (currentTime / durations[currentIndex]) * 100;
  };

  return (
    <AudioCardContainer $bgColor={album?.colors?.primary}>
      <BackgroundCard style={{ backgroundImage: `url(${album.albumImage})` }}>
        {error && (
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "rgba(255, 0, 0, 0.7)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "12px"
          }}>
            {error}
          </div>
        )}

        <audio
          ref={audioRef}
          src={album?.audioFiles[currentIndex]?.file}
          onError={() => setError("Error loading audio file")}
        />

        <AudioCountBadge $bgColor={album?.colors?.primary}>
          <PlaylistIcon />
          <p>{album?.audioFiles?.length}</p>
        </AudioCountBadge>

        <AudioIconsContainer>
          {audioAction === "Pause" && (
            <button type="button" onClick={playPrev} disabled={isLoading || !album?.audioFiles || album.audioFiles.length === 0}>
              <PlayLeftIcon />
            </button>
          )}
          <button type="button" onClick={toggleAudio} disabled={isLoading || !album?.audioFiles || album.audioFiles.length === 0}>
            {audioAction === "Play" ? <PlayIcon /> : <PauseIcon />}
          </button>
          {audioAction === "Pause" && (
            <button type="button" onClick={playNext} disabled={isLoading || !album?.audioFiles || album.audioFiles.length === 0}>
              <PlayRightIcon />
            </button>
          )}
        </AudioIconsContainer>

        {
          audioAction === "Pause" &&
          <AudioRangeTrackContainer>
            <AudioRangeTrackProgress
              $progress={calculateProgress()}
              $primaryColor={album?.colors?.secondary}
            />
          </AudioRangeTrackContainer>
        }
      </BackgroundCard>

      {isAudioFilesVisible && (
        <AudioDisplaySection $bgColor={album?.colors?.secondary} $textColor={album?.colors?.primary}>
          {album?.audioFiles?.map((audio, index) => (
            <button key={index} onClick={() => playSpecificTrack(index)} disabled={loadingStates[index] || !album?.audioFiles || album.audioFiles.length === 0}>
              <p
                style={{
                  color: index === currentIndex ? album?.colors?.primary : album?.colors.text ? album?.colors.text : "white",
                }}
              >
                {audio?.name}
              </p>
              <span
                style={{ color: index === currentIndex ? album?.colors?.primary : album?.colors.text ? album?.colors.text : "white" }}
              >
                {loadingStates[index] ? "Loading..." : durations[index] ? formatTime(durations[index]) : "Error"}
              </span>
            </button>
          ))}
        </AudioDisplaySection>
      )}

      <AudioTitleSection>
        <h2>{album?.albumName}</h2>
        <p>Our first single</p>
      </AudioTitleSection>
    </AudioCardContainer>
  );
}

export default AudioCard;

