import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update activeTab type
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'reports' | 'storage' | 'retention' | 'errors' | 'users' | 'ui' | 'admins'>('overview');",
    "const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'reports' | 'storage' | 'retention' | 'errors' | 'users' | 'ui' | 'admins' | 'hidden_docs'>('overview');"
)

# 2. Add imports
content = content.replace(
    "import AdminManagerModal from '../components/AdminManagerModal';",
    "import AdminManagerModal from '../components/AdminManagerModal';\nimport HiddenDocsManager from '../components/HiddenDocsManager';"
)
content = content.replace(
    "import { Users, BarChart3, Image as ImageIcon, LayoutDashboard, Shield, Activity, AlertTriangle, Database, LineChart as LineChartIcon, AlertOctagon, X, FileText, User as UserIcon, MapPin, Clock } from 'lucide-react';",
    "import { Users, BarChart3, Image as ImageIcon, LayoutDashboard, Shield, Activity, AlertTriangle, Database, LineChart as LineChartIcon, AlertOctagon, X, FileText, User as UserIcon, MapPin, Clock, EyeOff } from 'lucide-react';"
)

# 3. Add sidebar link
sidebar_link = """
              <button
                onClick={() => setActiveTab('hidden_docs')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  activeTab === 'hidden_docs' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <EyeOff className="w-5 h-5" />
                Tài liệu ẩn
              </button>
"""
target_sidebar = "<Database className=\"w-5 h-5\" />\n                Tài nguyên hệ thống\n              </button>"
if target_sidebar in content:
    content = content.replace(target_sidebar, target_sidebar + "\n" + sidebar_link)
else:
    print("Warning: target sidebar link not found.")


# 4. Add tab content
tab_content = """
          {activeTab === 'hidden_docs' && (
            <HiddenDocsManager />
          )}
"""
target_tab_content = "{activeTab === 'admins' && ("
if target_tab_content in content:
    content = content.replace(target_tab_content, tab_content + "\n          " + target_tab_content)
else:
    print("Warning: target tab content not found.")

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)

