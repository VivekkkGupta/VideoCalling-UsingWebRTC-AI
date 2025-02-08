import InputPage from "./Pages/InputPage";
import VideoCall from "./Pages/VideoCall";
import {  Routes, Route } from "react-router-dom";
import Layout from "./Pages/Layout";

function App() {
  return (
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
        path="/room/:interest"
        element={
          <Layout>
            <VideoCall />
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
