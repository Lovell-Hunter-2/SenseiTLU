import re

with open('src/components/ClockWidget.tsx', 'r') as f:
    content = f.read()

# Cloud patch
old_cloud = '<span className="text-base group-hover:animate-sway origin-bottom">☁️</span>'
new_cloud = """              <span className="relative flex items-center justify-center w-5 h-5 overflow-visible">
                <span className="absolute transition-all duration-700 ease-in-out z-10 text-base group-hover:animate-sway origin-bottom group-hover:-translate-x-1">☁️</span>
                <span className="absolute transition-all duration-700 ease-in-out transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-x-2 group-hover:-translate-y-1 text-sm z-0">☀️</span>
              </span>"""
content = content.replace(old_cloud, new_cloud)

# Cherry blossom patch
old_cherry = '<span className="text-base group-hover:animate-bounce">🌸</span>'
new_cherry = """          <span className="relative flex items-center justify-center w-5 h-5 overflow-visible">
            <span className="text-base group-hover:animate-bounce z-10 relative">🌸</span>
            <div className="absolute inset-0 pointer-events-none -m-4 overflow-hidden z-0 hidden group-hover:block">
              <span className="absolute text-[8px] top-[-5px] left-[20%] animate-petal-fall" style={{ animationDelay: '0.1s', animationDuration: '2.2s' }}>🌸</span>
              <span className="absolute text-[10px] top-[-10px] left-[50%] animate-petal-fall" style={{ animationDelay: '0.4s', animationDuration: '1.8s' }}>🌸</span>
              <span className="absolute text-[8px] top-[0px] left-[80%] animate-petal-fall" style={{ animationDelay: '0.7s', animationDuration: '2.5s' }}>🌸</span>
              <span className="absolute text-[12px] top-[-15px] left-[35%] animate-petal-fall" style={{ animationDelay: '1.2s', animationDuration: '2s' }}>🌸</span>
              <span className="absolute text-[9px] top-[-5px] left-[70%] animate-petal-fall" style={{ animationDelay: '0.5s', animationDuration: '2.1s' }}>🌸</span>
            </div>
          </span>"""
content = content.replace(old_cherry, new_cherry)

with open('src/components/ClockWidget.tsx', 'w') as f:
    f.write(content)

