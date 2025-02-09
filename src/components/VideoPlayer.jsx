import React, { useEffect } from "react";

function VideoPlayer({ stream, userName, isLocal }) {

  return (
    <div className="relative bg-gray-800 rounded-lg w-full h-full overflow-hidden">
      {stream ? (

        <>
          <div className="absolute inset-0">
            <video
              ref={(video) => video && (video.srcObject = stream)}
              autoPlay
              playsInline
              muted={isLocal}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full">
            <p className="text-white text-sm font-medium">
              {userName} {isLocal ? "(You)" : ""}
            </p>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center px-4">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-white font-medium text-sm">
              {isLocal ? "Camera will be enabled once connected" : "Waiting for user to join..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;