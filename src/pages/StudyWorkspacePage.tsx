import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize, Volume2, VolumeX } from 'lucide-react';
import { PomodoroWidget } from '../components/PomodoroWidget';

const VIDEOS = [
  { id: 'bCFhyL0N82A', name: 'Sunset in the beach' },
  { id: 'NJuSStkIZBg', name: 'Café zone' },
  { id: '5jJfQIUsDOY', name: 'Study with me' },
  { id: 'gZknpSi4CP8', name: 'Natural sound' },
  { id: 'DXT9dF-WK-I', name: 'Tokyo street', start: 3207 },
  { id: 'N2m4RFhCqKg', name: 'Rainny day' }
];

export default function StudyWorkspace() {
  const navigate = useNavigate();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeVideo = VIDEOS[activeVideoIndex];

  // Update volume in iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const targetVolume = isMuted ? 0 : volume;
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [targetVolume]
        }),
        '*'
      );
    }
  }, [volume, isMuted, activeVideoIndex]);

  // Request fullscreen
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden z-50 flex flex-col dark">
      {/* Background YouTube Video */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&mute=0&loop=1&playlist=${activeVideo.id}&controls=0&showinfo=0&rel=0&modestbranding=1&enablejsapi=1${activeVideo.start ? `&start=${activeVideo.start}` : ''}`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="w-full h-full object-cover scale-[1.15]" // scale to hide yt logo/borders
        />
      </div>

      {/* Overlay to dim the video if needed */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Top Left Controls */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full flex items-center justify-center transition-colors shadow-lg"
          title="Back to Study Space"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Top Right Pomodoro Widget */}
      <PomodoroWidget variant="fixed" position="top-right" />

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-lg border border-white/20 p-2 px-3 sm:px-4 rounded-full shadow-2xl w-[95vw] sm:w-auto max-w-full overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Volume Control */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-white hover:text-gray-300 transition-colors p-1"
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              setVolume(Number(e.target.value));
            }}
            className="w-16 sm:w-24 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        
        <div className="w-px h-6 bg-white/30 mx-1 sm:mx-2 shrink-0" />

        <div className="flex items-center gap-2 shrink-0">
          {VIDEOS.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setActiveVideoIndex(index)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeVideoIndex === index
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              {video.name}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-white/30 mx-1 sm:mx-2 shrink-0" />
        
        <button
          onClick={handleFullscreen}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
          title="Toàn màn hình"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
