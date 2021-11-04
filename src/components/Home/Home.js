import { useState, lazy, Suspense } from "react";
import { getUser } from "services/youtube";
import "./home.css";
import Import from "./Import";
import Playlists from "./Playlists";

const YoutubeModal = lazy(() => import("./YoutubeModal"));

export default function Home() {
  const [youtube, setYoutube] = useState(() => ({ user: getUser() }));

  return (
    <div className="home" data-dropdown-parent>
      <Import youtube={youtube} setYoutube={setYoutube}/>
      <Playlists youtube={youtube} setYoutube={setYoutube}/>
      {youtube.modalVisible && (
        <Suspense fallback={null}>
          <YoutubeModal youtube={youtube} setYoutube={setYoutube}/>
        </Suspense>
      )}
    </div>
  );
}
