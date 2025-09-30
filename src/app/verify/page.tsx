"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

type Role = "influencer" | "advertiser";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const role = (searchParams.get("role") as Role | null) ?? null;
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { refresh } = useCurrentUser();

  const isDisabled = useMemo(() => !email || !role || otp.length !== 6, [email, role, otp.length]);

  const handleSend = useCallback(async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    const supabase = getSupabaseBrowserClient();
    const result = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (result.error) {
      setErrorMessage(result.error.message ?? "코드 전송에 실패했습니다.");
    } else {
      setInfoMessage("이메일로 전송된 6자리 코드를 입력해주세요.");
    }
  }, [email]);

  const handleVerify = useCallback(async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);
    const supabase = getSupabaseBrowserClient();
    const result = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (result.error) {
      setErrorMessage(result.error.message ?? "코드 검증에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    // 역할별 페이지로 이동
    await refresh();
    router.replace(`/${role}/profile`);
  }, [email, otp, role, router]);

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">이메일 인증</h1>
      <p className="text-sm text-gray-600">입력하신 이메일로 전송된 6자리 코드를 입력하세요.</p>
      <div className="space-y-2">
        <Input value={email} readOnly />
        <div className="flex gap-2">
          <Input
            name="otp"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="------"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button type="button" variant="outline" onClick={handleSend}>코드 재전송</Button>
        </div>
      </div>
      {errorMessage && <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{errorMessage}</div>}
      {infoMessage && <div className="rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 p-3 text-sm">{infoMessage}</div>}
      <Button type="button" disabled={isSubmitting || isDisabled} onClick={handleVerify} className="w-full">
        {isSubmitting ? "인증 중..." : "인증 완료"}
      </Button>
    </main>
  );
}


