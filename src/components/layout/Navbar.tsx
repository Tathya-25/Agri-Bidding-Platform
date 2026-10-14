import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, LogOut, TestTube } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const { user, profile, effectiveRole, toggleDevModeRole, devMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-neutral-900 tracking-tight">AgriBids</span>
        </Link>

        {user && profile && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-neutral-900">{profile.email}</span>
              <span className="text-xs text-emerald-600 font-semibold">{effectiveRole}</span>
            </div>

            <Button
              variant={devMode ? "secondary" : "outline"}
              size="sm"
              onClick={toggleDevModeRole}
              className="hidden md:flex gap-2"
              title="Toggle Role for testing"
            >
              <TestTube className="h-4 w-4" />
              <span>{devMode ? 'Dev Mode On' : 'Demo'}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-500 hover:text-red-600">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
      
      {/* Mobile Dev Toggle floating */}
      {user && profile && (
         <button
           onClick={toggleDevModeRole}
           className="md:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-amber-500 text-white p-3 flex items-center gap-2"
         >
           <TestTube className="h-5 w-5" />
         </button>
      )}
    </nav>
  );
};
