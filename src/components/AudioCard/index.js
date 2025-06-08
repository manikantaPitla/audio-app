import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [currentTime, setCurrentTime] = useState(0);

  // Individual track states for better error handling
  const [trackStates, setTrackStates] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  const audioRef = useRef(null);
  const audioObjectsRef = useRef([]);

  // Initialize track states when album changes
  useEffect(() => {
    if (!album?.audioFiles || album.audioFiles.length === 0) {
      setTrackStates([]);
      setIsInitialLoading(false);
      return;
    }

    // Initialize track states
    const initialStates = album.audioFiles.map(() => ({
      isLoading: true,
      duration: 0,
      error: null,
      retryCount: 0
    }));

    setTrackStates(initialStates);
    setIsInitialLoading(true);
    setGlobalError(null);
    setCurrentTime(0);
    setCurrentIndex(0);
  }, [album]);

  // Load audio metadata with improved error handling
  const loadAudioMetadata = useCallback(async (track, index) => {
    const maxRetries = 2;
    const loadTimeout = 10000; // 10 seconds timeout

    const attemptLoad = (retryCount = 0) => {
      return new Promise((resolve, reject) => {
        const tempAudio = new Audio();
        let timeoutId;

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          tempAudio.removeEventListener("loadedmetadata", onLoadedMetadata);
          tempAudio.removeEventListener("error", onError);
          tempAudio.removeEventListener("canplaythrough", onCanPlayThrough);
        };

        const onLoadedMetadata = () => {
          cleanup();
          resolve({
            duration: tempAudio.duration,
            success: true
          });
        };

        const onError = (e) => {
          cleanup();
          console.error(`Error loading ${track.name} (attempt ${retryCount + 1}):`, e);
          reject(new Error(`Failed to load audio: ${e.message || 'Unknown error'}`));
        };

        const onCanPlayThrough = () => {
          // Additional check to ensure audio is actually playable
          if (tempAudio.duration && tempAudio.duration > 0) {
            cleanup();
            resolve({
              duration: tempAudio.duration,
              success: true
            });
          }
        };

        // Set up timeout
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout loading audio after ${loadTimeout}ms`));
        }, loadTimeout);

        // Set up event listeners
        tempAudio.addEventListener("loadedmetadata", onLoadedMetadata);
        tempAudio.addEventListener("error", onError);
        tempAudio.addEventListener("canplaythrough", onCanPlayThrough);

        // Configure audio loading
        tempAudio.preload = "metadata";
        tempAudio.crossOrigin = "anonymous"; // Handle CORS issues

        try {
          tempAudio.src = track.file;
        } catch (error) {
          cleanup();
          reject(error);
        }
      });
    };

    // Retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await attemptLoad(attempt);

        // Update track state on success
        setTrackStates(prevStates => {
          const newStates = [...prevStates];
          if (newStates[index]) {
            newStates[index] = {
              isLoading: false,
              duration: result.duration,
              error: null,
              retryCount: attempt
            };
          }
          return newStates;
        });

        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          // Final attempt failed
          setTrackStates(prevStates => {
            const newStates = [...prevStates];
            if (newStates[index]) {
              newStates[index] = {
                isLoading: false,
                duration: 0,
                error: error.message,
                retryCount: attempt
              };
            }
            return newStates;
          });

          console.error(`Failed to load ${track.name} after ${maxRetries + 1} attempts:`, error);
          return { success: false, error: error.message };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }, []);

  // Load all audio metadata with progressive loading
  useEffect(() => {
    if (!album?.audioFiles || album.audioFiles.length === 0) {
      setIsInitialLoading(false);
      return;
    }

    const loadAllMetadata = async () => {
      setIsInitialLoading(true);

      // Clean up previous audio objects
      audioObjectsRef.current.forEach(audio => {
        try {
          audio.src = '';
          audio.load();
        } catch (e) {
          console.warn('Error cleaning up audio object:', e);
        }
      });
      audioObjectsRef.current = [];

      // Load metadata progressively (2 at a time to avoid overwhelming the browser)
      const batchSize = 2;
      const batches = [];

      for (let i = 0; i < album.audioFiles.length; i += batchSize) {
        batches.push(album.audioFiles.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const promises = batch.map((track, batchIndex) => {
          const actualIndex = batches.indexOf(batch) * batchSize + batchIndex;
          return loadAudioMetadata(track, actualIndex);
        });

        await Promise.allSettled(promises);

        // Small delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setIsInitialLoading(false);
    };

    loadAllMetadata();

    // Cleanup function - Fixed ESLint warning by removing unused loadingTimeoutRef
    return () => {
      audioObjectsRef.current.forEach(audio => {
        try {
          audio.src = '';
          audio.load();
        } catch (e) {
          console.warn('Error cleaning up audio object:', e);
        }
      });
      audioObjectsRef.current = [];
    };
  }, [album, loadAudioMetadata]);

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
      if (audioElement && !isNaN(audioElement.currentTime)) {
        setCurrentTime(audioElement.currentTime);
      }
    };

    if (audioElement) {
      audioElement.addEventListener("timeupdate", handleTimeUpdate);

      if (audioAction === "Pause") {
        timeUpdateInterval = setInterval(() => {
          if (audioElement && !isNaN(audioElement.currentTime)) {
            setCurrentTime(audioElement.currentTime);
          }
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

  // Retry loading a specific track
  const retryTrack = useCallback(async (index) => {
    if (!album?.audioFiles || !album.audioFiles[index]) return;

    setTrackStates(prevStates => {
      const newStates = [...prevStates];
      if (newStates[index]) {
        newStates[index] = {
          ...newStates[index],
          isLoading: true,
          error: null
        };
      }
      return newStates;
    });

    await loadAudioMetadata(album.audioFiles[index], index);
  }, [album, loadAudioMetadata]);

  const toggleAudio = () => {
    if (!isAudioFilesVisible) setAudioFilesVisible(true);

    // Check if current track has an error
    if (trackStates[currentIndex]?.error) {
      setGlobalError(`Cannot play "${album.audioFiles[currentIndex]?.name}": ${trackStates[currentIndex].error}`);
      return;
    }

    try {
      if (audioAction === "Play") {
        const playPromise = audioRef.current?.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAudioAction("Pause");
              setGlobalError(null);
            })
            .catch(error => {
              console.error("Playback failed:", error);
              setGlobalError(`Playback failed: ${error.message}`);
            });
        }
      } else {
        audioRef.current?.pause();
        setAudioAction("Play");
      }
    } catch (err) {
      console.error("Error toggling audio:", err);
      setGlobalError(`Playback error: ${err.message}`);
    }
  };

  const playNext = () => {
    if (!album?.audioFiles || album.audioFiles.length === 0) return;

    const nextIndex = (currentIndex + 1) % album.audioFiles.length;
    setCurrentIndex(nextIndex);
    setCurrentTime(0);

    if (audioAction === "Pause") {
      setTimeout(() => {
        if (trackStates[nextIndex]?.error) {
          setGlobalError(`Cannot play "${album.audioFiles[nextIndex]?.name}": ${trackStates[nextIndex].error}`);
          setAudioAction("Play");
          return;
        }

        try {
          const playPromise = audioRef.current?.play();

          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Playback failed:", error);
              setGlobalError(`Playback failed: ${error.message}`);
              setAudioAction("Play");
            });
          }
        } catch (err) {
          console.error("Error playing next track:", err);
          setGlobalError(`Playback error: ${err.message}`);
          setAudioAction("Play");
        }
      }, 100);
    }
  };

  const playPrev = () => {
    if (!album?.audioFiles || album.audioFiles.length === 0) return;

    const prevIndex = (currentIndex - 1 + album.audioFiles.length) % album.audioFiles.length;
    setCurrentIndex(prevIndex);
    setCurrentTime(0);

    if (audioAction === "Pause") {
      setTimeout(() => {
        if (trackStates[prevIndex]?.error) {
          setGlobalError(`Cannot play "${album.audioFiles[prevIndex]?.name}": ${trackStates[prevIndex].error}`);
          setAudioAction("Play");
          return;
        }

        try {
          const playPromise = audioRef.current?.play();

          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Playback failed:", error);
              setGlobalError(`Playback failed: ${error.message}`);
              setAudioAction("Play");
            });
          }
        } catch (err) {
          console.error("Error playing previous track:", err);
          setGlobalError(`Playback error: ${err.message}`);
          setAudioAction("Play");
        }
      }, 100);
    }
  };

  const playSpecificTrack = (index) => {
    if (!album?.audioFiles || index < 0 || index >= album.audioFiles.length) return;

    // Check if track has an error
    if (trackStates[index]?.error) {
      setGlobalError(`Cannot play "${album.audioFiles[index]?.name}": ${trackStates[index].error}`);
      return;
    }

    setCurrentIndex(index);
    setCurrentTime(0);

    setTimeout(() => {
      try {
        const playPromise = audioRef.current?.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAudioAction("Pause");
              setGlobalError(null);
            })
            .catch(error => {
              console.error("Playback failed:", error);
              setGlobalError(`Playback failed: ${error.message}`);
              setAudioAction("Play");
            });
        }
      } catch (err) {
        console.error("Error playing specific track:", err);
        setGlobalError(`Playback error: ${err.message}`);
        setAudioAction("Play");
      }
    }, 100);
  };

  const calculateProgress = () => {
    const currentTrackState = trackStates[currentIndex];
    if (!currentTrackState?.duration || currentTrackState.duration === 0) return 0;
    return (currentTime / currentTrackState.duration) * 100;
  };

  // Get track display info
  const getTrackDisplayInfo = (index) => {
    const trackState = trackStates[index];

    if (!trackState) {
      return { text: "Loading...", isError: false };
    }

    if (trackState.isLoading) {
      return { text: "Loading...", isError: false };
    }

    if (trackState.error) {
      return { text: "Error", isError: true };
    }

    if (trackState.duration) {
      return { text: formatTime(trackState.duration), isError: false };
    }

    return { text: "Unknown", isError: true };
  };

  // Check if any tracks have errors - Fixed ESLint warning by using the variable
  const hasErrorTracks = trackStates.some(state => state.error);

  return (
    <AudioCardContainer $bgColor={album?.colors?.primary} >
      <BackgroundCard style={{ backgroundImage: `url(${album.albumImage})` }}>
        {globalError && (
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "rgba(255, 0, 0, 0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            maxWidth: "280px",
            wordWrap: "break-word",
            zIndex: 10
          }}>
            {globalError}
            <button
              onClick={() => setGlobalError(null)}
              style={{
                marginLeft: "8px",
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              ×
            </button>
          </div>
        )}

        <audio
          ref={audioRef}
          src={album?.audioFiles[currentIndex]?.file}
          onError={(e) => {
            console.error("Audio element error:", e);
            setGlobalError(`Error loading current track: ${e.target?.error?.message || 'Unknown error'}`);
          }}
          onLoadStart={() => setGlobalError(null)}
        />

        <AudioCountBadge $bgColor={album?.colors?.primary} $textColor={album?.colors?.titleColor}>
          <PlaylistIcon />
          <p>{album?.audioFiles?.length || 0}</p>
        </AudioCountBadge>

        <AudioIconsContainer>
          {audioAction === "Pause" && (
            <button
              type="button"
              onClick={playPrev}
              disabled={isInitialLoading || !album?.audioFiles || album.audioFiles.length === 0}
              title="Previous track"
            >
              <PlayLeftIcon />
            </button>
          )}
          <button
            type="button"
            onClick={toggleAudio}
            disabled={isInitialLoading || !album?.audioFiles || album.audioFiles.length === 0}
            title={audioAction === "Play" ? "Play" : "Pause"}
          >
            {audioAction === "Play" ? <PlayIcon /> : <PauseIcon />}
          </button>
          {audioAction === "Pause" && (
            <button
              type="button"
              onClick={playNext}
              disabled={isInitialLoading || !album?.audioFiles || album.audioFiles.length === 0}
              title="Next track"
            >
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
          {album?.audioFiles?.map((audio, index) => {
            const displayInfo = getTrackDisplayInfo(index);
            const trackState = trackStates[index];

            return (
              <button
                key={index}
                onClick={() => trackState?.error ? retryTrack(index) : playSpecificTrack(index)}
                disabled={trackState?.isLoading}
                title={trackState?.error ? `Click to retry: ${trackState.error}` : `Play ${audio.name}`}
                style={{
                  opacity: trackState?.error ? 0.7 : 1
                }}
              >
                <p
                  style={{
                    color: index === currentIndex
                      ? album?.colors?.text
                      : displayInfo.isError
                        ? "#ff6b6b"
                        : album?.colors.text
                          ? album?.colors.textDefault
                          : "white",
                  }}
                >
                  {audio?.name}
                  {trackState?.error && " (Click to retry)"}
                </p>
                <span
                  style={{
                    color: index === currentIndex
                      ? album?.colors?.text
                      : displayInfo.isError
                        ? "#ff6b6b"
                        : album?.colors.text
                          ? album?.colors.textDefault
                          : "white"
                  }}
                >
                  {displayInfo.text}
                </span>
              </button>
            );
          })}

          {hasErrorTracks && (
            <div style={{
              padding: "10px",
              fontSize: "11px",
              color: album?.colors.text || "white",
              opacity: 0.7,
              textAlign: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              Some tracks failed to load. Click on error tracks to retry.
            </div>
          )}
        </AudioDisplaySection>
      )}

      <AudioTitleSection $text={album?.colors?.titleColor}>
        <h2>{album?.albumName}</h2>
        <p>{album?.subTitle}</p>
      </AudioTitleSection>
    </AudioCardContainer>
  );
}

export default AudioCard;

