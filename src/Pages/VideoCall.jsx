import React from 'react'
import { useAppContext } from '../contexts/AppContext'  
import VideoView from '../components/VideoView'
import ChatPanel from '../components/ChatPanel'
import ActionButtons from '../components/ActionButtons'

function VideoCall() {
  const { userName, userInterest } = useAppContext();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 p-4">
        {/* Video content area */}
        <div className="bg-gray-800 rounded-lg h-full flex items-center justify-center">
          <p className="text-white">Video Stream Area</p>
        </div>
      </div>
      
      {/* User info display */}
      <div className="px-4 py-2 bg-gray-100">
        <p className="text-sm text-gray-600">
          Connected as: <span className="font-semibold">{userName}</span>
        </p>
        <p className="text-sm text-gray-600">
          Interest: <span className="font-semibold">{userInterest}</span>
        </p>
      </div>

      {/* Action buttons */}
      <ActionButtons />
    </div>
  )
}

export default VideoCall