import InputPage from "./Pages/InputPage";
import VideoCall from "./Pages/VideoCall";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Pages/Layout";
import { AppProvider } from "./contexts/AppContext";

function App() {
  return (
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
            path="/video"
            element={
              <Layout>
                <VideoCall />
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
