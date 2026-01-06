import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateProfile } from './useProfile';

export function usePhoneVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProfile = useUpdateProfile();

  const sendVerificationCode = async (phoneNumber: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        phone: phoneNumber,
      });

      if (error) throw error;
      
      setVerificationSent(true);
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (phoneNumber: string, token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token,
        type: 'phone_change',
      });

      if (error) throw error;

      // Update profile with verified phone number
      await updateProfile.mutateAsync({ phone_number: phoneNumber });
      
      setVerificationSent(false);
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setVerificationSent(false);
    setError(null);
  };

  return {
    isLoading,
    verificationSent,
    error,
    sendVerificationCode,
    verifyCode,
    resetState,
  };
}
