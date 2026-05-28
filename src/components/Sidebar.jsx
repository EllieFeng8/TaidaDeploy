import { LayoutDashboard, Plus } from 'lucide-react';

export function Sidebar({ onNewVersionClick }) {
  const menuItems = [
    { id: 'dashboard', label: '儀表板', icon: LayoutDashboard },
  ];

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-slate-50 border-r border-slate-200 flex flex-col py-6 z-50">
      {/* Brand Profile Header */}
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">台達 DevOps</h1>

      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = item.id === 'dashboard';
          return (
            <button
              key={item.id}
              type="button"
              className={`w-full flex items-center px-4 py-3 rounded-xl font-sans text-sm font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <IconComponent
                className={`mr-3 w-5 h-5 transition-transform group-hover:scale-105 duration-200 ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>


    </aside>
  );
}
