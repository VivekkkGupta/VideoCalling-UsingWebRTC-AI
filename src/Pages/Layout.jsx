import React from 'react'

function Layout({children}) {
  return (
    <div className='bg-gradient-to-br from-indigo-600 to-purple-700 h-screen w-screen flex items-center justify-center'>
        <div className='flex items-center justify-center bg-white/95 backdrop-blur-sm w-[95%] md:w-[90%] lg:w-[85%] h-[95%] md:h-[90%] lg:h-[85%] rounded-2xl text-black shadow-2xl'>
            {children}
        </div>
    </div>
  )
}

export default Layout