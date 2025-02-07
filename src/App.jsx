import InputPage from "./Pages/InputPage";
import VideoCall from "./Pages/VideoCall";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Pages/Layout";
import { AppProvider } from "./contexts/AppContext";
import { SocketProvider } from "./contexts/Socket";
import { PeerProvider } from "./contexts/Peer";

function App() {
  return (
    <PeerProvider>
      <SocketProvider>
        <AppProvider>
          <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Layout>
                  <InputPage />
                </Layout>
              }
            />
            <Route
              path="/video/:interest"
              element={
                <Layout>
                  <VideoCall />
                </Layout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </SocketProvider>
    </PeerProvider>
  );
}

export default App;
