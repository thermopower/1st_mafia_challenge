"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Alert 컴포넌트 미설치: 임시 박스로 대체
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, XCircle, Calendar, Building } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

interface Application {
  id: string;
  campaignId: string;
  campaignTitle: string;
  companyName: string;
  status: '신청완료' | '선정' | '반려';
  appliedAt: string;
  updatedAt: string;
  visitDate: string;
}

interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, userRole, isRoleLoading } = useCurrentUser();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isAuthLoading || isRoleLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (userRole !== 'influencer') {
      setError('인플루언서만 지원 목록을 조회할 수 있습니다.');
      setIsLoading(false);
      return;
    }

    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, isAuthenticated, userRole, statusFilter, router]);

  const fetchApplications = async () => {
    try {
      const { data } = await apiClient.get('/api/my-applications', {
        params: statusFilter !== 'all' ? { status: statusFilter } : undefined,
      });
      setApplications(data.applications);
    } catch (error) {
      setError(extractApiErrorMessage(error, '지원 목록을 불러오는데 실패했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '신청완료':
        return <Badge className="bg-blue-100 text-blue-800">신청완료</Badge>;
      case '선정':
        return <Badge className="bg-green-100 text-green-800">선정</Badge>;
      case '반려':
        return <Badge variant="secondary">반려</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '신청완료':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case '선정':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case '반려':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">지원 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 지원 목록</h1>
              <p className="text-gray-600">지원한 체험단의 진행 상태를 확인하세요</p>
            </div>

            <Button variant="outline" onClick={() => router.push('/')}>
              홈으로 돌아가기
            </Button>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="신청완료">신청완료</SelectItem>
              <SelectItem value="선정">선정</SelectItem>
              <SelectItem value="반려">반려</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 지원 목록 */}
        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 mb-4">아직 지원한 체험단이 없습니다.</p>
              <Button onClick={() => router.push('/')}>
                체험단 둘러보기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{application.campaignTitle}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {application.companyName}
                        </span>
                        {getStatusBadge(application.status)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getStatusIcon(application.status)}
                      <span>상태: {application.status}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>지원일: {new Date(application.appliedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>방문예정: {new Date(application.visitDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/campaigns/${application.campaignId}`)}
                    >
                      체험단 상세보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
