with open('src/pages/AdminDashboard.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const dateStr = date.toISOString().split('T')[0];" in line and 380 < i < 400:
        lines[i] = "              const dateStr = date.dateStr;\n"
    elif "const displayDate = `${date.getDate()}/${date.getMonth() + 1}`;" in line and 380 < i < 400:
        lines[i] = "              const displayDate = date.displayDate;\n"

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.writelines(lines)

