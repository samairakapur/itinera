import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Extra bottom padding on mobile so content isn't hidden under the tab bar */}
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
