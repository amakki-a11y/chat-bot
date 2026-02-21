import { NavLink } from 'react-router-dom';
import {
  BarChart3, Bot, Gauge, BookOpen, HelpCircle, Ticket,
  Webhook, ToggleLeft, Palette, Eye, X,
} from 'lucide-react';

const sections = [
  {
    label: 'General',
    items: [
      { to: '/dashboard', icon: BarChart3, label: 'Analytics', end: true },
    ],
  },
  {
    label: 'Training',
    items: [
      { to: '/dashboard/training', icon: Bot, label: 'Bot Config' },
      { to: '/dashboard/rate-limits', icon: Gauge, label: 'Rate Limits' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/dashboard/kb', icon: BookOpen, label: 'Knowledge Base' },
      { to: '/dashboard/faq', icon: HelpCircle, label: 'FAQ' },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/dashboard/tickets', icon: Ticket, label: 'Tickets' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { to: '/dashboard/webhooks', icon: Webhook, label: 'Webhooks' },
      { to: '/dashboard/channels', icon: ToggleLeft, label: 'Channels & Files' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/dashboard/branding', icon: Palette, label: 'Branding' },
      { to: '/dashboard/preview', icon: Eye, label: 'Widget Preview' },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-[#1e293b] border-r border-[#334155] flex flex-col transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-bold text-slate-100">Menu</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.label}
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-400 border-r-2 border-indigo-400'
                        : 'text-slate-400 hover:bg-[#334155] hover:text-slate-100'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
