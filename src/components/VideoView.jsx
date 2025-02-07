import React from "react";

function VideoView({ username }) {
  return (
    <div className="w-full h-full bg-opacity-20 bg-black rounded-2xl p-5 flex items-center justify-center">
      {username}
    </div>
  );
}

export default VideoView;
