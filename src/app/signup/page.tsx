"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSignup } from "@/features/feature01-signup/hooks/useSignup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Alert 컴포넌트가 없으므로 임시 경고 박스로 대체합니다.

const defaultFormState = {
  email: "",
  password: "",
  confirmPassword: "",
};

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh } = useCurrentUser();

  // 새로운 회원가입 시스템 사용
  const signupHook = useSignup();

  // 기존 Supabase Auth용 상태 (하위 호환성)
  const [formState, setFormState] = useState(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  const isSubmitDisabled = useMemo(
    () =>
      !formState.email.trim() ||
      !formState.password.trim() ||
      formState.password !== formState.confirmPassword,
    [formState.confirmPassword, formState.email, formState.password]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormState((previous) => ({ ...previous, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      setInfoMessage(null);

      if (formState.password !== formState.confirmPassword) {
        setErrorMessage("비밀번호가 일치하지 않습니다.");
        setIsSubmitting(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();

      try {
        const result = await supabase.auth.signUp({
          email: formState.email,
          password: formState.password,
        });

        if (result.error) {
          setErrorMessage(result.error.message ?? "회원가입에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        await refresh();

        const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";

        if (result.data.session) {
          router.replace(redirectedFrom);
          return;
        }

        setInfoMessage(
          "확인 이메일을 보냈습니다. 이메일 인증 후 로그인해 주세요."
        );
        router.prefetch("/login");
        setFormState(defaultFormState);
      } catch (error) {
        setErrorMessage("회원가입 처리 중 문제가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.confirmPassword, formState.email, formState.password, refresh, router, searchParams]
  );

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">
            블로그 체험단 플랫폼에 가입하세요
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <form className="space-y-4">
            {signupHook.error && (
              <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {signupHook.error}
              </div>
            )}
            {signupHook.successMessage && (
              <div className="rounded-md border border-green-300 bg-green-50 text-green-800 p-3 text-sm">
                {signupHook.successMessage}
              </div>
            )}

            <div>
              <Label htmlFor="fullName">이름 *</Label>
              <Input
                id="fullName"
                type="text"
                value={signupHook.data.fullName}
                onChange={(e) => signupHook.updateField('fullName', e.target.value)}
                placeholder="실명을 입력하세요"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">휴대폰번호 *</Label>
              <Input
                id="phone"
                type="tel"
                value={signupHook.data.phone}
                onChange={(e) => signupHook.updateField('phone', e.target.value)}
                placeholder="010-1234-5678"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={signupHook.data.email}
                onChange={(e) => signupHook.updateField('email', e.target.value)}
                placeholder="example@email.com"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="userRole">역할 선택 *</Label>
              <Select
                value={signupHook.data.userRole}
                onValueChange={(value: 'advertiser' | 'influencer') =>
                  signupHook.updateField('userRole', value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="역할을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="influencer">인플루언서</SelectItem>
                  <SelectItem value="advertiser">광고주</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="authMethod">인증 방식 *</Label>
              <Select
                value={signupHook.data.authMethod}
                onValueChange={(value: 'email' | 'external') =>
                  signupHook.updateField('authMethod', value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="인증 방식을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">이메일 인증</SelectItem>
                  <SelectItem value="external">소셜 로그인</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="terms"
                checked={signupHook.data.termsAccepted}
                onCheckedChange={(checked) => signupHook.updateField('termsAccepted', !!checked)}
              />
              <Label htmlFor="terms" className="ml-2 text-sm">
                이용약관 및 개인정보처리방침에 동의합니다 *
              </Label>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={signupHook.isLoading || !signupHook.data.termsAccepted}
              onClick={() => signupHook.submitSignup()}
            >
              {signupHook.isLoading ? '회원가입 중...' : '회원가입'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              로그인
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Image
            src="https://picsum.photos/seed/signup/400/200"
            alt="회원가입"
            width={400}
            height={200}
            className="rounded-lg mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
