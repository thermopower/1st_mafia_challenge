'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useCampaignApplicants,
  useSelectInfluencers,
  useRejectInfluencers,
  useUpdateCampaignStatus,
} from '@/features/feature09-campaign-admin/hooks/useCampaignAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { extractApiErrorMessage, isAxiosError } from '@/lib/remote/api-client';

const AccessDenied = () => (
  <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-6 text-center">
    <h1 className="text-2xl font-semibold">접근이 제한되었습니다</h1>
    <p className="text-sm text-muted-foreground">
      이 체험단에 대한 권한이 없습니다. 다른 계정으로 로그인했는지 확인하거나 관리자에게 문의해주세요.
    </p>
    <Button asChild>
      <a href="/advertiser/campaigns">내 체험단으로 돌아가기</a>
    </Button>
  </main>
);

const ErrorState = ({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) => (
  <main className="mx-auto max-w-2xl p-6 text-center">
    <div className="rounded bg-destructive/10 p-4 text-sm text-destructive">{message}</div>
    {onRetry ? (
      <Button className="mt-4" onClick={onRetry} disabled={isRetrying}>
        다시 시도
      </Button>
    ) : null}
  </main>
);

type StatusFilter = '전체' | '신청완료' | '선정' | '반려';

export default function CampaignAdminPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = (params?.id ?? '') as string;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCampaignApplicants(campaignId);
  const updateStatus = useUpdateCampaignStatus(campaignId);
  const selectMutation = useSelectInfluencers(campaignId);
  const rejectMutation = useRejectInfluencers(campaignId);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [earlyTerminationReason, setEarlyTerminationReason] = useState('');
  const [isEarlyTerminationDialogOpen, setIsEarlyTerminationDialogOpen] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  const selectedIds = useMemo(() => Object.keys(selected).filter((key) => selected[key]), [selected]);

  const filteredApplicants = useMemo(() => {
    if (!data) return [];
    if (statusFilter === '전체') return data.applicants;
    return data.applicants.filter((a) => a.status === statusFilter);
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, pending: 0, selected: 0, rejected: 0 };
    return {
      total: data.applicants.length,
      pending: data.applicants.filter((a) => a.status === '신청완료').length,
      selected: data.applicants.filter((a) => a.status === '선정').length,
      rejected: data.applicants.filter((a) => a.status === '반려').length,
    };
  }, [data]);

  const handleEarlyTermination = () => {
    updateStatus.mutate({ status: '조기종료', reason: earlyTerminationReason });
    setIsEarlyTerminationDialogOpen(false);
    setEarlyTerminationReason('');
  };

  if (!campaignId) {
    return <ErrorState message="잘못된 접근입니다." />;
  }

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

  if (isError) {
    if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      return <AccessDenied />;
    }

    const message = extractApiErrorMessage(error, '체험단 정보를 불러오지 못했습니다. 다시 시도해 주세요.');
    return <ErrorState message={message} onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  if (!data) {
    return <ErrorState message="체험단 정보를 불러오지 못했습니다." onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">지원자 관리</h1>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.campaignInfo.title}</CardTitle>
          <CardDescription>
            상태: {data.campaignInfo.status} · 모집 인원: {data.campaignInfo.recruitmentCount}명 · 선정: {data.campaignInfo.selectedCount}명
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 지원자</CardDescription>
            <CardTitle className="text-3xl">{stats.total}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>신청완료</CardDescription>
            <CardTitle className="text-3xl">{stats.pending}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>선정</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.selected}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>반려</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}명</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['전체', '신청완료', '선정', '반려'] as StatusFilter[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              size="sm"
            >
              {status}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => updateStatus.mutate({ status: '모집종료' })} size="sm">
            모집 종료
          </Button>
          <Dialog open={isEarlyTerminationDialogOpen} onOpenChange={setIsEarlyTerminationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">조기 종료</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>조기 종료</DialogTitle>
                <DialogDescription>
                  체험단을 조기 종료하는 이유를 입력해주세요. 이 정보는 지원자들에게 공유됩니다.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="조기 종료 사유를 입력하세요..."
                value={earlyTerminationReason}
                onChange={(e) => setEarlyTerminationReason(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEarlyTerminationDialogOpen(false)}>취소</Button>
                <Button variant="destructive" onClick={handleEarlyTermination}>조기 종료</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => selectMutation.mutate({ selectedInfluencerIds: selectedIds })}
          disabled={selectedIds.length === 0 || selectMutation.isPending}
        >
          선정 처리 ({selectedIds.length})
        </Button>
        <Button
          variant="destructive"
          onClick={() => rejectMutation.mutate({ rejectedInfluencerIds: selectedIds })}
          disabled={selectedIds.length === 0 || rejectMutation.isPending}
        >
          반려 처리 ({selectedIds.length})
        </Button>
      </div>

      {filteredApplicants.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {statusFilter === '전체' ? '아직 지원자가 없습니다.' : `${statusFilter} 상태의 지원자가 없습니다.`}
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y rounded border bg-card">
          {filteredApplicants.map((applicant) => (
            <li key={applicant.id} className="flex items-center gap-4 p-4">
              <input
                type="checkbox"
                checked={Boolean(selected[applicant.influencerId])}
                onChange={() => toggle(applicant.influencerId)}
                aria-label={applicant.influencerName + ' 선택'}
                className="h-4 w-4"
                disabled={applicant.status !== '신청완료'}
              />
              <div className="flex-1 space-y-1">
                <div className="font-medium">
                  {applicant.influencerName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {applicant.snsChannelName} · 팔로워 {applicant.followerCount.toLocaleString()}명
                </div>
                <div className="text-sm">
                  <span className="font-medium">지원 동기:</span> {applicant.motivation}
                </div>
                <div className="text-xs text-muted-foreground">
                  방문 예정일: {applicant.visitDate} · 지원일: {new Date(applicant.appliedAt).toLocaleDateString()}
                </div>
              </div>
              <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                applicant.status === '선정' ? 'bg-green-100 text-green-700' :
                applicant.status === '반려' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {applicant.status}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
