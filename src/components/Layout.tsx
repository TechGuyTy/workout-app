import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  TrophyIcon, 
  BookOpenIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Today', href: '/', icon: CalendarDaysIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
  { name: 'Exercise PRs', href: '/exercise-prs', icon: TrophyIcon },
  { name: 'Templates', href: '/templates', icon: BookOpenIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Layout({ children }: LayoutProps) {
  // const _location = useLocation()

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="medieval-title">⚔️ Workout Tracker</div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 right-0 z-50">
        <div className="flex justify-around">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs ${
                  isActive 
                    ? 'text-medieval-400 bg-gray-700 rounded-t-lg' 
                    : 'text-gray-400 hover:text-gray-300'
                }`
              }
            >
              <item.icon className="h-6 w-6 mb-1" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  )
}
