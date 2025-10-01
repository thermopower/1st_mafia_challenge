"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, AuthMethod } from '@/features/auth/types';

export interface SignupFormData {
  fullName: string;
  phone: string;
  email: string;
  userRole: UserRole;
  authMethod: AuthMethod;
  termsAccepted: boolean;
}

export interface SignupState {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  data: SignupFormData;
}

const initialFormData: SignupFormData = {
  fullName: '',
  phone: '',
  email: '',
  userRole: 'influencer',
  authMethod: 'email',
  termsAccepted: false,
};

export const useSignup = () => {
  const router = useRouter();
  const [state, setState] = useState<SignupState>({
    isLoading: false,
    error: null,
    successMessage: null,
    data: initialFormData,
  });

  const updateField = <K extends keyof SignupFormData>(
    field: K,
    value: SignupFormData[K]
  ) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
      error: null, // 에러 초기화
      successMessage: null,
    }));
  };

  const submitSignup = async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, successMessage: null }));

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state.data),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch (e) {
        // 서버가 JSON이 아닌 응답을 보냈을 때 안전 처리
        result = null;
      }

      if (!response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result?.error?.message || (response.status === 409 ? '이미 가입된 이메일입니다.' : '회원가입에 실패했습니다.'),
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        successMessage: '확인 이메일을 보냈습니다. 메일의 코드로 인증을 완료해주세요.',
      }));

      // 회원가입용 OTP 입력 페이지로 이동
      const role = state.data.userRole;
      const email = encodeURIComponent(state.data.email);
      router.replace(`/verify?email=${email}&role=${role}`);

      return true;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '네트워크 오류가 발생했습니다.',
      }));
      return false;
    }
  };

  const resetForm = () => {
    setState({
      isLoading: false,
      error: null,
      successMessage: null,
      data: initialFormData,
    });
  };

  return {
    ...state,
    updateField,
    submitSignup,
    resetForm,
  };
};
