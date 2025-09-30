"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface CampaignInfo {
  id: string;
  title: string;
  endDate: string;
  location: string;
}

export default function CampaignApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useCurrentUser();

  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const campaignId = params.id as string;

  const [formData, setFormData] = useState({
    motivation: '',
    visitDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (userRole !== 'influencer') {
      setError('인플루언서만 체험단에 지원할 수 있습니다.');
      setIsLoading(false);
      return;
    }

    if (!campaignId) {
      setError('체험단 ID가 필요합니다.');
      setIsLoading(false);
      return;
    }

    fetchCampaignInfo();
  }, [isAuthenticated, userRole, campaignId, router]);

  const fetchCampaignInfo = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || '체험단 정보를 불러오는데 실패했습니다.');
        return;
      }

      setCampaign({
        id: result.data.id,
        title: result.data.title,
        endDate: result.data.endDate,
        location: result.data.location,
      });
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaign || !user) return;

    // 클라이언트 측 유효성 검사
    if (formData.motivation.trim().length < 10) {
      setError('각오 한마디는 최소 10자 이상 입력해주세요.');
      return;
    }

    if (!formData.visitDate) {
      setError('방문 예정일을 선택해주세요.');
      return;
    }

    const selectedDate = new Date(formData.visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError('방문 예정일은 오늘 이후 날짜만 선택 가능합니다.');
      return;
    }

    const endDate = new Date(campaign.endDate);
    if (selectedDate > endDate) {
      setError('방문 예정일은 모집 마감일 이전이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          motivation: formData.motivation.trim(),
          visitDate: formData.visitDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || '지원서 제출에 실패했습니다.');
        return;
      }

      setSuccess(true);

      // 3초 후 내 지원 목록으로 이동
      setTimeout(() => {
        router.push('/me/applications');
      }, 3000);

    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">체험단 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              className="w-full mt-4"
              onClick={() => router.push('/')}
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">지원 완료!</h2>
            <p className="text-gray-600 mb-4">
              체험단 지원이 성공적으로 제출되었습니다.
            </p>
            <p className="text-sm text-gray-500">
              3초 후 내 지원 목록으로 이동합니다...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push(`/campaigns/${campaignId}`)}>
            ← 체험단 상세로 돌아가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">체험단 지원하기</CardTitle>
            <CardDescription>
              {campaign.title} - {campaign.location}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="motivation">각오 한마디 *</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  placeholder="이 체험단에 참여하고 싶은 이유와 각오를 자유롭게 작성해주세요 (최소 10자)"
                  className="mt-1 min-h-32"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.motivation.length}/1000자
                </p>
              </div>

              <div>
                <Label htmlFor="visitDate">방문 예정일 *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => handleInputChange('visitDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  max={campaign.endDate}
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  모집 마감일({new Date(campaign.endDate).toLocaleDateString()}) 이전 날짜를 선택해주세요.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    지원 제출 중...
                  </>
                ) : (
                  '체험단 지원하기'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>지원 후 광고주가 선정 여부를 결정합니다.</p>
              <p>선정 결과는 내 지원 목록에서 확인할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
