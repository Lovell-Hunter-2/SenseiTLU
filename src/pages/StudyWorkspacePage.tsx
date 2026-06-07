import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize, Volume2, VolumeX, Plus, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { PomodoroWidget } from '../components/PomodoroWidget';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logActivityEvent } from '../useActivityLogger';

const DEFAULT_VIDEOS = [
  { id: 'bCFhyL0N82A', name: 'Sunset on the beach' },
  { id: 'NJuSStkIZBg', name: 'Café zone' },
  { id: '5jJfQIUsDOY', name: 'Study with me' },
  { id: 'gZknpSi4CP8', name: 'Natural sound' },
  { id: 'DXT9dF-WK-I', name: 'Tokyo street', start: 3207 },
  { id: 'N2m4RFhCqKg', name: 'Rainny day' }
];

export default function StudyWorkspace() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [videos, setVideos] = useState(DEFAULT_VIDEOS);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(true); // default to true for autoplay
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVideoName, setNewVideoName] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [showStudyStream, setShowStudyStream] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (user && user.uid) {
      logActivityEvent(user.uid, "Truy cập không gian", "Study Space (Workspace)", "/workspace");
    }
  }, [user]);

  // Fallback to active index 0 if list is truncated
  const safeIndex = activeVideoIndex < videos.length ? activeVideoIndex : 0;
  const activeVideo = videos[safeIndex];

  // Fetch workspaces from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'studyWorkspaces'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().videos) {
        setVideos(docSnap.data().videos);
      }
    });
    return () => unsub();
  }, []);

  // Update volume in iframe
  useEffect(() => {
    const updateVolume = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        if (isMuted || volume === 0) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*'
          );
        } else {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }), '*'
          );
        }
      }
    };

    updateVolume();
    
    // When video changes, the iframe takes time to load. We send the volume command
    // multiple times to ensure it catches the player when it becomes ready.
    const timers = [
      setTimeout(updateVolume, 500),
      setTimeout(updateVolume, 1500),
      setTimeout(updateVolume, 3000)
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
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

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    let id = newVideoUrl;
    const match = newVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    if (match && match[1]) {
      id = match[1];
    }
    
    if (!id || !newVideoName) return;

    const updatedVideos = [...videos, { id, name: newVideoName }];
    try {
      await setDoc(doc(db, 'settings', 'studyWorkspaces'), { videos: updatedVideos }, { merge: true });
      setShowAddModal(false);
      setNewVideoName('');
      setNewVideoUrl('');
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu video');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden z-50 flex flex-col dark">
      {/* Background YouTube Video */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {activeVideo && !showStudyStream && (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&mute=1&loop=1&playlist=${activeVideo.id}&controls=0&showinfo=0&rel=0&modestbranding=1&enablejsapi=1${activeVideo.start ? `&start=${activeVideo.start}` : ''}`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full"
          />
        )}
      </div>

      {showStudyStream && (
        <div className="absolute inset-0 w-full h-full bg-black z-30">
          <iframe
            src="https://app.studystream.live/focus/room"
            className="w-full h-full border-none"
            allow="camera; microphone; display-capture; autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}

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

      {/* Bottom Controls Toggle Button (when hidden) */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-in-out ${
          isControlsVisible ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <button
          onClick={() => setIsControlsVisible(true)}
          className="bg-black/40 backdrop-blur-lg border border-white/20 p-2 sm:p-3 rounded-full shadow-2xl text-white hover:bg-white/20 transition-colors"
          title="Hiện thanh công cụ"
        >
          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-lg border border-white/20 p-2 px-3 sm:px-4 rounded-full shadow-2xl w-[95vw] sm:w-auto max-w-full overflow-x-auto transition-all duration-500 ease-in-out ${
          isControlsVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`} 
        style={{ scrollbarWidth: 'none' }}
      >
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
          {videos.map((video, index) => (
            <button
              key={video.id + index}
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
          onClick={() => setShowStudyStream(!showStudyStream)}
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
            showStudyStream ? 'bg-indigo-600 text-white' : 'text-white hover:bg-white/20'
          }`}
          title="Học cùng mọi người trên StudyStream"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">StudyStream</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
            title="Thêm video workspace"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={handleFullscreen}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
          title="Toàn màn hình"
        >
          <Maximize className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/30 mx-1 sm:mx-2 shrink-0" />

        <button
          onClick={() => setIsControlsVisible(false)}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
          title="Ẩn thanh công cụ"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Add Workspace Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Thêm Workspace mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Đóng"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tên Workspace
                </label>
                <input
                  type="text"
                  value={newVideoName}
                  onChange={(e) => setNewVideoName(e.target.value)}
                  placeholder="Ví dụ: Lofi Chill"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Link hoặc ID Youtube
                </label>
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
