"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MapPin, Users, Calendar, AlertCircle, Loader2 } from 'lucide-react';

interface CampaignDetail {
  id: string;
  title: string;
  description: string;
  mission: string;
  benefits: string;
  location: string;
  recruitmentCount: number;
  startDate: string;
  endDate: string;
  status: '모집중' | '모집종료' | '선정완료' | '조기종료';
  advertiser: {
    companyName: string;
    category: string;
  };
  canApply: boolean;
  applicationDeadline: string;
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, userRole } = useCurrentUser();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campaignId = params?.id as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!campaignId) {
      setError('체험단 ID가 필요합니다.');
      setIsLoading(false);
      return;
    }

    fetchCampaignDetail();
  }, [isAuthenticated, campaignId, router]);

  const fetchCampaignDetail = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const payload = await response.json();

      if (!response.ok) {
        const fallbackMessage = '체험단 정보를 불러오는데 실패했습니다.';
        setError((payload?.error as { message?: string } | undefined)?.message ?? fallbackMessage);
        return;
      }

      setCampaign(payload as CampaignDetail);
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    router.push(`/campaigns/${campaignId}/apply`);
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

  if (error) {
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

  if (!campaign) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '모집중':
        return <Badge className="bg-green-100 text-green-800">모집중</Badge>;
      case '모집종료':
        return <Badge variant="secondary">모집종료</Badge>;
      case '선정완료':
        return <Badge className="bg-blue-100 text-blue-800">선정완료</Badge>;
      case '조기종료':
        return <Badge variant="outline">조기종료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push('/')}>
            ← 홈으로 돌아가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{campaign.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 text-base">
                  <span className="font-medium">{campaign.advertiser.companyName}</span>
                  <span className="text-gray-500">•</span>
                  <span>{campaign.advertiser.category}</span>
                  {getStatusBadge(campaign.status)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 체험단 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">장소</p>
                    <p className="text-gray-600">{campaign.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">모집 인원</p>
                    <p className="text-gray-600">{campaign.recruitmentCount}명</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">모집 기간</p>
                    <p className="text-gray-600">
                      {new Date(campaign.startDate).toLocaleDateString()} ~
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">제공 혜택</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {campaign.benefits}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">미션 내용</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {campaign.mission}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 상세 설명 */}
            <div>
              <h3 className="font-medium mb-3">상세 설명</h3>
              <div className="text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                {campaign.description}
              </div>
            </div>

            {/* 지원 버튼 또는 권한 메시지 */}
            <div className="flex justify-center pt-6">
              {campaign.canApply ? (
                <Button
                  size="lg"
                  onClick={handleApply}
                  className="px-8"
                >
                  체험단 지원하기
                </Button>
              ) : (
                <Alert className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {userRole === 'influencer'
                      ? '인플루언서 정보 등록 후 지원할 수 있습니다.'
                      : '지원 권한이 없습니다.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
