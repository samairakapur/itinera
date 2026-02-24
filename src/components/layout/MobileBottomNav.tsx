import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Calendar, Navigation, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',            label: 'Home',        icon: Home      },
  { href: '/destinations', label: 'Explore',    icon: MapPin    },
  { href: '/trips',       label: 'My Trips',    icon: Calendar  },
  { href: '/nearby',      label: 'Nearby',      icon: Navigation },
  { href: '/profile',     label: 'Profile',     icon: User      },
];

/**
 * Sticky bottom tab bar — only visible on mobile (md:hidden).
 * Shows icon + label for every route, matching the desktop navbar links.
 */
const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-background/95 backdrop-blur border-t border-border/40',
        'safe-area-pb', // respects iOS home bar
      )}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(href);

          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon
                className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')}
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
