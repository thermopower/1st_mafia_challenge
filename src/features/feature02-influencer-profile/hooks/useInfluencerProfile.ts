"use client";

import { useState, useCallback } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { InfluencerProfileInput } from '../backend/service';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

export interface InfluencerProfileState {
  profile: InfluencerProfileInput | null;
  isLoading: boolean;
  error: string | null;
}

const initialProfile: InfluencerProfileInput = {
  birthDate: '',
  snsChannelName: '',
  snsChannelUrl: '',
  followerCount: 0,
};

export const useInfluencerProfile = () => {
  const { user } = useCurrentUser();
  const [state, setState] = useState<InfluencerProfileState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  const createProfile = useCallback(async (profileData: InfluencerProfileInput): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: '로그인이 필요합니다.' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      try {
        const { data } = await apiClient.post('/api/influencer-profile', profileData);
        setState(prev => ({
          ...prev,
          isLoading: false,
          profile: data,
        }));
        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: extractApiErrorMessage(error, '프로필 생성에 실패했습니다.'),
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: '네트워크 오류가 발생했습니다.' }));
      return false;
    }
  }, [user]);

  const updateProfile = useCallback(async (profileData: Partial<InfluencerProfileInput>): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: '로그인이 필요합니다.' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      try {
        const { data } = await apiClient.patch('/api/influencer-profile', profileData);
        setState(prev => ({
          ...prev,
          isLoading: false,
          profile: data,
        }));
        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: extractApiErrorMessage(error, '프로필 업데이트에 실패했습니다.'),
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: '네트워크 오류가 발생했습니다.' }));
      return false;
    }
  }, [user]);

  const fetchProfile = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: '로그인이 필요합니다.' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      try {
        const { data } = await apiClient.get('/api/influencer-profile');
        setState(prev => ({
          ...prev,
          isLoading: false,
          profile: data,
        }));
        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: extractApiErrorMessage(error, '프로필 조회에 실패했습니다.'),
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: '네트워크 오류가 발생했습니다.' }));
      return false;
    }
  }, [user]);

  const updateField = useCallback(<K extends keyof InfluencerProfileInput>(
    field: K,
    value: InfluencerProfileInput[K]
  ) => {
    setState(prev => ({
      ...prev,
      profile: prev.profile ? {
        ...prev.profile,
        [field]: value,
      } : {
        ...initialProfile,
        [field]: value,
      },
      error: null, // 에러 초기화
    }));
  }, []);

  return {
    ...state,
    updateField,
    createProfile,
    updateProfile,
    fetchProfile,
    hasProfile: !!state.profile,
  };
};
