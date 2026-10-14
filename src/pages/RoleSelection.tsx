import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserProfile, checkAndSeedDatabase } from '../services/api';
import { Role } from '../types';
import { Button } from '../components/ui/Button';
import { Tractor, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const RoleSelectionPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" />;
  if (profile) return <Navigate to={profile.role === 'Customer' ? '/customer-dashboard' : '/marketplace'} />;

  const handleComplete = async () => {
    if (!selectedRole || !user) return;
    setIsSubmitting(true);
    try {
      await createUserProfile(user.uid, user.email || '', selectedRole);
      // Optional: seed database if it's the first time
      await checkAndSeedDatabase();
      await refreshProfile();
      toast.success(`Role set to ${selectedRole}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to set role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl border border-neutral-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome to AgriBids</h1>
        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
          Please select how you will be using the platform to continue to your tailored experience.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedRole('Customer')}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all ${
              selectedRole === 'Customer'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-neutral-200 hover:border-emerald-300 hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            <Tractor className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-bold mb-2">Customer</h2>
            <p className="text-sm opacity-80">I want to post agricultural work orders and receive bids.</p>
          </button>

          <button
            onClick={() => setSelectedRole('Bidder')}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all ${
              selectedRole === 'Bidder'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-neutral-200 hover:border-emerald-300 hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            <Users className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-bold mb-2">Bidder</h2>
            <p className="text-sm opacity-80">I want to browse open work orders and submit competitive bids.</p>
          </button>
        </div>

        <Button
          size="lg"
          className="w-full sm:w-auto px-12"
          disabled={!selectedRole || isSubmitting}
          onClick={handleComplete}
        >
          {isSubmitting ? 'Saving...' : 'Continue to Dashboard'}
        </Button>
      </div>
    </div>
  );
};
