import { useState, useRef, useEffect } from 'react'
import { SITE_CONFIG } from '../config'

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    audioRef.current = new Audio(SITE_CONFIG.musicUrl)
    audioRef.current.loop = true
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => console.log('播放失败，需要用户交互', e))
    }
    setIsPlaying(!isPlaying)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <button
        onClick={togglePlay}
        className="bg-white/90 backdrop-blur-md shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-all duration-300 border border-gray-200"
        title={isPlaying ? '暂停音乐' : '播放音乐'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      <div className="absolute bottom-14 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {SITE_CONFIG.musicTitle}
        </div>
      </div>
    </div>
  )
}
