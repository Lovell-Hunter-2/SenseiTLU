with open('src/components/ClockWidget.tsx', 'r') as f:
    content = f.read()

old_cloud = """                            <span className="relative flex items-center justify-center w-5 h-5 overflow-visible">
                <span className="absolute transition-all duration-700 ease-in-out z-10 text-base group-hover:animate-sway origin-bottom group-hover:-translate-x-1">☁️</span>
                <span className="absolute transition-all duration-700 ease-in-out transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-x-2 group-hover:-translate-y-1 text-sm z-0">☀️</span>
              </span>"""

new_cloud = """              <span className="relative flex items-center justify-center w-6 h-6 overflow-visible">
                <span className="absolute z-10 text-base origin-bottom transition-transform duration-500 group-hover:-translate-x-1">☁️</span>
                <span className="absolute text-sm z-0 opacity-0 scale-50 -translate-x-2 translate-y-1 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-2 group-hover:-translate-y-1 group-hover:rotate-12">☀️</span>
              </span>"""

if old_cloud in content:
    content = content.replace(old_cloud, new_cloud)
else:
    print("Cloud not found, trying regex...")
    import re
    # Fallback if indentation differs
    content = re.sub(
        r'<span className="relative flex items-center justify-center w-5 h-5 overflow-visible">.*?</span>\s*</span>',
        new_cloud,
        content,
        flags=re.DOTALL
    )

with open('src/components/ClockWidget.tsx', 'w') as f:
    f.write(content)

