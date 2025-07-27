import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TopNavBar from '@/components/navigation/TopNavBar';
import MapLayout from '@/components/map/MapLayout';

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <ProtectedRoute>
        {/* Top Navigation Bar */}
        <TopNavBar />
        
        {/* Main Content Area */}
        <div className="flex-1">
          <MapLayout />
        </div>
      </ProtectedRoute>
    </main>
  );
}
