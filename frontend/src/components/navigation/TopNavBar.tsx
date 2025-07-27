'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TopNavBar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - App name */}
        <div className="text-lg font-semibold text-gray-900">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Map Route App'}
        </div>
        
        {/* Center - User email */}
        <div className="text-sm text-gray-600">
          {user.email}
        </div>
        
        {/* Right side - Logout button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          Sign Out
        </Button>
      </div>
    </nav>
  );
}
