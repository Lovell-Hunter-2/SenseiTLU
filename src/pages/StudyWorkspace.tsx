import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Maximize } from 'lucide-react';
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

  const activeVideo = VIDEOS[activeVideoIndex];

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
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <iframe
          src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&mute=0&loop=1&playlist=${activeVideo.id}&controls=0&showinfo=0&rel=0&modestbranding=1${activeVideo.start ? `&start=${activeVideo.start}` : ''}`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="w-full h-full object-cover scale-[1.1]" // scale to hide yt logo/borders
        />
      </div>

      {/* Overlay to dim the video if needed, and to catch clicks */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-black/40 backdrop-blur-lg border border-white/20 p-2 px-4 rounded-full shadow-2xl">
        {VIDEOS.map((video, index) => (
          <button
            key={video.id}
            onClick={() => setActiveVideoIndex(index)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeVideoIndex === index
                ? 'bg-white text-black'
                : 'text-white hover:bg-white/20'
            }`}
          >
            {video.name}
          </button>
        ))}
        
        <div className="w-px h-6 bg-white/30 mx-2" />
        
        <button
          onClick={handleFullscreen}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          title="Toàn màn hình"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
