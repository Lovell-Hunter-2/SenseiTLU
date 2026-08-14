with open('src/components/ClockWidget.tsx', 'r') as f:
    content = f.read()

old_cloud = """              <span className="relative flex items-center justify-center w-6 h-6 overflow-visible">
                <span className="absolute z-10 text-base origin-bottom transition-transform duration-500 group-hover:-translate-x-1">☁️</span>
                <span className="absolute text-sm z-0 opacity-0 scale-50 -translate-x-2 translate-y-1 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-2 group-hover:-translate-y-1 group-hover:rotate-12">☀️</span>
              </span>"""

new_cloud = """              <span className="relative flex items-center justify-center w-6 h-6 overflow-visible group-hover:animate-sway origin-bottom">
                <span className="absolute z-10 text-base transition-transform duration-500 group-hover:-translate-x-1.5">☁️</span>
                <span className="absolute text-sm z-0 opacity-0 scale-50 -translate-x-2 translate-y-1 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-2 group-hover:-translate-y-1 group-hover:rotate-12">☀️</span>
              </span>"""

content = content.replace(old_cloud, new_cloud)

with open('src/components/ClockWidget.tsx', 'w') as f:
    f.write(content)
