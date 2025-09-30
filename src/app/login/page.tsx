"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, isAuthenticated } = useCurrentUser();
  const [formState, setFormState] = useState({ email: "", otp: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const nextValue = name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value;
    setFormState((prev) => ({ ...prev, [name]: nextValue }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      setInfoMessage(null);
      const supabase = getSupabaseBrowserClient();

      try {
        if (step === 'request') {
          const result = await supabase.auth.signInWithOtp({
            email: formState.email,
            options: {
              // 프로젝트 설정에 따라 매직링크/OTP 전송
              shouldCreateUser: false,
            },
          });

          if (result.error) {
            setErrorMessage(result.error.message ?? '코드 전송에 실패했습니다.');
          } else {
            setStep('verify');
            setInfoMessage('이메일로 전송된 6자리 코드를 입력해주세요.');
          }
        } else {
          const result = await supabase.auth.verifyOtp({
            email: formState.email,
            token: formState.otp,
            type: 'email',
          });

          if (result.error) {
            setErrorMessage(result.error.message ?? '코드 검증에 실패했습니다.');
          } else {
            await refresh();
            const redirectedFrom = searchParams.get('redirectedFrom') ?? '/';
            router.replace(redirectedFrom);
          }
        }
      } catch (error) {
        setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.email, formState.otp, step, refresh, router, searchParams]
  );

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">로그인</h1>
        <p className="text-slate-500">
          Supabase 계정으로 로그인하고 보호된 페이지에 접근하세요.
        </p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-6 shadow-sm">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            이메일
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={formState.email}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            />
          </label>
          {step === 'verify' && (
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              이메일 코드 (6자리)
              <input
                type="text"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="------"
                required
                value={formState.otp}
                onChange={handleChange}
                className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              />
            </label>
          )}
          {errorMessage ? (
            <p className="text-sm text-rose-500">{errorMessage}</p>
          ) : null}
          {infoMessage ? (
            <p className="text-sm text-emerald-600">{infoMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? (step === 'request' ? '코드 전송 중' : '인증 중') : step === 'request' ? '코드 전송' : '코드 확인'}
          </button>
          <p className="text-xs text-slate-500">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="font-medium text-slate-700 underline hover:text-slate-900"
            >
              회원가입
            </Link>
          </p>
        </form>
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <Image
            src="https://picsum.photos/seed/login/640/640"
            alt="로그인"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
