import { HashRouter } from "react-router-dom";
import { NotificationProvider } from "contexts/notification";
import { PlaylistProvider } from "contexts/playlist";
import { QueueProvider } from "contexts/queue";
import { PlayerProvider } from "contexts/player";
import Player from "components/Player";

export default function App() {
  return (
    <HashRouter>
      <NotificationProvider>
        <PlaylistProvider>
          <QueueProvider>
            <PlayerProvider>
              <Player/>
            </PlayerProvider>
          </QueueProvider>
        </PlaylistProvider>
      </NotificationProvider>
    </HashRouter>
  );
}
