import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Calendar, Navigation, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',             label: 'Home',        icon: Home,       tourAttr: undefined       },
  { href: '/destinations', label: 'Explore',     icon: MapPin,     tourAttr: 'nav-explore'   },
  { href: '/trips',        label: 'My Trips',    icon: Calendar,   tourAttr: undefined       },
  { href: '/nearby',       label: 'Nearby',      icon: Navigation, tourAttr: 'nav-nearby'    },
  { href: '/profile',      label: 'Profile',     icon: User,       tourAttr: 'nav-profile'   },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-white/95 backdrop-blur-md border-t border-border',
        'safe-area-pb',
      )}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ href, label, icon: Icon, tourAttr }) => {
          const isActive =
            href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(href);

          return (
            <Link
              key={href}
              to={href}
              {...(tourAttr ? { 'data-tour': tourAttr } : {})}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform',
                  isActive && 'stroke-[2.5px] scale-110',
                )}
              />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
