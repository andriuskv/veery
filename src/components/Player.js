import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "contexts/notification";
import { usePlayer } from "contexts/player";
import Sidebar from "components/Sidebar";
import PlayerBar from "components/PlayerBar";

const Home = lazy(() => import("components/Home"));
const Search = lazy(() => import("components/Search"));
const Playlist = lazy(() => import("components/Playlist"));
const NowPlaying = lazy(() => import("components/NowPlaying"));
const Queue = lazy(() => import("components/Queue"));
const Notification = lazy(() => import("components/Notification"));
const PlayerStateIndicator = lazy(() => import("components/PlayerStateIndicator"));
const NoMatch = lazy(() => import("components/NoMatch"));

export default function Player() {
  const { notifications } = useNotification();
  const { initialized, activeTrack } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();
  const [queueVisible, setQueueVisible] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState(() => {
    const mode = localStorage.getItem("youtube-player") || "off";
    return getYoutubeIconState(mode);
  });
  const [indicator, setIndicator] = useState(null);
  const indicatorTimeoutId = useRef(0);
  const lastRoute = useRef("/");
  const nowPlayingVisible = location.pathname.startsWith("/now-playing");

  useLayoutEffect(() => {
    if (!initialized) {
      return;
    }
    if (nowPlayingVisible) {
      if (activeTrack) {
        window.addEventListener("keydown", handleGlobalKeydown);
      }
      else {
        navigate("/", { replace: true });
      }
    }
    return () => {
      window.removeEventListener("keydown", handleGlobalKeydown);
    };
  }, [initialized, activeTrack, location.pathname]);

  useLayoutEffect(() => {
    if (activeTrack) {
      if (activeTrack.player === "native" && youtubePlayer.mode !== "off") {
        setYoutubePlayer({ stateBefore: youtubePlayer });
      }
      else if (activeTrack.player === "youtube" && youtubePlayer.stateBefore) {
        setYoutubePlayer({ ...youtubePlayer.stateBefore });
      }
      return;
    }

    if (queueVisible) {
      setQueueVisible(false);
    }
  }, [activeTrack]);

  useEffect(() => {
    if (youtubePlayer.mode === "off") {
      return;
    }
    window.addEventListener("blur", blurIframe);

    return () => {
      window.removeEventListener("blur", blurIframe);
    };

  }, [youtubePlayer]);

  function handleGlobalKeydown({ key }) {
    if (key === "Escape") {
      toggleNowPlaying();
    }
  }

  function blurIframe() {
    const element = document.activeElement;

    if (element instanceof HTMLIFrameElement) {
      requestAnimationFrame(() => {
        element.blur();
      });
    }
  }

  function toggleNowPlaying() {
    if (nowPlayingVisible) {
      navigate(lastRoute.current);
      lastRoute.current = "";
    }
    else {
      navigate("/now-playing");
      lastRoute.current = location.pathname;
    }
  }

  function toggleQueue() {
    setQueueVisible(!queueVisible);
  }

  function showIndicator(indicator) {
    if (indicator) {
      setIndicator(null);
    }
    requestAnimationFrame(() => {
      setIndicator(indicator);

      clearTimeout(indicatorTimeoutId.current);
      indicatorTimeoutId.current = setTimeout(() => {
        setIndicator(null);
      }, 1000);
    });
  }

  function getYoutubeIconState(mode) {
    const modes = {
      "off": {
        mode: "off",
        title: "Show YouTube player",
        iconId: "mini"
      },
      "mini": {
        mode: "mini",
        title: "Maximize YouTube player",
        iconId: "maximized",
        active: true
      },
      "maximized": {
        mode: "maximized",
        title: "Hide YouTube player",
        iconId: "off",
        active: true
      }
    };

    return modes[mode];
  }

  function toggleYoutubePlayer() {
    const modeMap = {
      "off": "mini",
      "mini": "maximized",
      "maximized": "off"
    };
    const nextMode = modeMap[youtubePlayer.mode];

    setYoutubePlayer(getYoutubeIconState(nextMode));
    localStorage.setItem("youtube-player", nextMode);
  }

  function renderYoutubePlayer() {
    let classNames = "";

    if (nowPlayingVisible) {
      if (youtubePlayer.mode === "mini") {
        classNames = " visible";
      }
      else if (youtubePlayer.mode === "maximized") {
        classNames = " visible maximized";
      }
    }
    return (
      <div id="js-youtube-player-container" className={`youtube-player-container${classNames}${queueVisible ? " shift" : ""}`}></div>
    );
  }

  return (
    <>
      {nowPlayingVisible ? null : <Sidebar/>}
      <div className="content">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/search" element={<Search/>}/>
            <Route path="/playlist/:id" element={<Playlist/>}/>
            <Route path="/now-playing" element={activeTrack ? <NowPlaying queueVisible={queueVisible} youtubePlayerMode={youtubePlayer.mode} showIndicator={showIndicator}/> : null}/>
            <Route path="*" element={<NoMatch/>}/>
          </Routes>
        </Suspense>
      </div>
      <PlayerBar nowPlayingVisible={nowPlayingVisible} queueVisible={queueVisible} youtubePlayer={youtubePlayer}
        toggleNowPlaying={toggleNowPlaying} toggleQueue={toggleQueue} toggleYoutubePlayer={toggleYoutubePlayer}
        showIndicator={showIndicator}/>
      {queueVisible && activeTrack && (
        <Suspense fallback={null}>
          <Queue toggleQueue={toggleQueue} nowPlayingVisible={nowPlayingVisible}
            youtubePlayerMaximized={youtubePlayer.mode === "maximized"}/>
        </Suspense>
      )}
      {notifications.length > 0 && (
        <Suspense fallback={null}>
          <Notification notifications={notifications}/>
        </Suspense>
      )}
      {renderYoutubePlayer()}
      {indicator && (
        <Suspense fallback={null}>
          <PlayerStateIndicator indicator={indicator} nowPlayingVisible={nowPlayingVisible}
            queueVisible={queueVisible}
            youtubePlayerMaximized={youtubePlayer.mode === "maximized"}/>
        </Suspense>
      )}
    </>
  );
}
