'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function UserProfile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  if (!user) return null;

  return (
    <Card className="absolute top-4 right-4 w-64 shadow-lg">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">
            Logged In As: {user.name}
          </p>
          <p className="text-xs text-gray-600">
            {user.email}
          </p>
          <p className="text-xs text-gray-500">
            Account Created On: {new Date(user.created_at).toLocaleDateString()}
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full mt-3"
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
