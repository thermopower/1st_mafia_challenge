"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useInfluencerProfile } from '@/features/feature02-influencer-profile/hooks/useInfluencerProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateSNSUrl, validateChannelName, validateFollowerCount, validateBirthDate } from '@/lib/validation/sns-utils';

export default function InfluencerProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useCurrentUser();
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const {
    profile,
    isLoading,
    error,
    updateField,
    createProfile,
    fetchProfile,
    hasProfile,
  } = useInfluencerProfile();

  useEffect(() => {
    // 기존 프로필이 있으면 조회만 수행. 리디렉션은 하지 않음.
    if (hasProfile) {
      fetchProfile();
    }
  }, [hasProfile, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    // 클라이언트 측 유효성 검사
    const birthDateValidation = validateBirthDate(profile.birthDate);
    if (!birthDateValidation.isValid) {
      setBirthDateError(birthDateValidation.error || '생년월일을 확인해주세요.');
      return;
    }
    setBirthDateError(null);

    const channelNameValidation = validateChannelName(profile.snsChannelName);
    if (!channelNameValidation.isValid) {
      updateField('snsChannelName', profile.snsChannelName);
      return;
    }

    const snsUrlValidation = validateSNSUrl(profile.snsChannelUrl);
    if (!snsUrlValidation.isValid) {
      updateField('snsChannelUrl', profile.snsChannelUrl);
      return;
    }

    const followerCountValidation = validateFollowerCount(profile.followerCount);
    if (!followerCountValidation.isValid) {
      updateField('followerCount', profile.followerCount);
      return;
    }

    const ok = await createProfile(profile);
    if (ok) {
      router.replace('/');
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">인플루언서 정보 등록</CardTitle>
            <CardDescription>
              체험단에 참여하기 위해 SNS 정보를 등록해주세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="birthDate">생년월일 *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={profile?.birthDate || ''}
                onChange={(e) => { updateField('birthDate', e.target.value); setBirthDateError(null); }}
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  만 14세 이상만 등록 가능합니다.
                </p>
              {birthDateError && (
                <p className="mt-1 text-sm text-red-600">{birthDateError}</p>
              )}
              </div>

              <div>
                <Label htmlFor="snsChannelName">SNS 채널명 *</Label>
                <Input
                  id="snsChannelName"
                  type="text"
                  value={profile?.snsChannelName || ''}
                  onChange={(e) => updateField('snsChannelName', e.target.value)}
                  placeholder="예: my_instagram_account"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  인스타그램, 유튜브 등에서 사용하는 채널명
                </p>
              </div>

              <div>
                <Label htmlFor="snsChannelUrl">SNS 채널 URL *</Label>
                <Input
                  id="snsChannelUrl"
                  type="url"
                  value={profile?.snsChannelUrl || ''}
                  onChange={(e) => updateField('snsChannelUrl', e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  인스타그램, 유튜브, 네이버 블로그, 트위터만 지원
                </p>
              </div>

              <div>
                <Label htmlFor="followerCount">팔로워 수 *</Label>
                <Input
                  id="followerCount"
                  type="number"
                  value={profile?.followerCount || ''}
                  onChange={(e) => updateField('followerCount', parseInt(e.target.value) || 0)}
                  min="0"
                  max="100000000"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  현재 팔로워 수를 입력해주세요 (최대 1억 명)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '등록 중...' : '인플루언서 정보 등록'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="mr-2"
              >
                홈으로 돌아가기
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/me/applications')}
              >
                내 지원 목록 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
