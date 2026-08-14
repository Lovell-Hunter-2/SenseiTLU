with open('src/components/ClockWidget.tsx', 'r') as f:
    content = f.read()

# Remove overflow-hidden from cherry blossom container
content = content.replace(
    "relative overflow-hidden group\">",
    "relative group\">"
)

# And in the flower, we have:
# <div className="absolute inset-0 pointer-events-none -inset-4 overflow-hidden z-0 hidden group-hover:block">
# But we already did: content = content.replace('-m-4 overflow-hidden', '-inset-4 overflow-hidden') earlier.
# Wait, let's just make sure the petals container is visible and doesn't get clipped.
# Let's change it to just `absolute pointer-events-none -inset-10 z-0 hidden group-hover:block` without overflow-hidden so they fall smoothly out.
content = content.replace(
    "absolute inset-0 pointer-events-none -inset-4 overflow-hidden z-0 hidden group-hover:block",
    "absolute pointer-events-none -inset-10 z-0 hidden group-hover:block"
)

with open('src/components/ClockWidget.tsx', 'w') as f:
    f.write(content)
