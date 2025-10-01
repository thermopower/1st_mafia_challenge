'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  useAdvertiserCampaigns,
  useDeleteCampaign,
} from '@/features/feature08-campaign-create/hooks/useCampaignCreate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRightIcon, FilePlusIcon } from 'lucide-react';

const EmptyState = () => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <FilePlusIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-base font-medium text-foreground">등록된 체험단이 없습니다.</p>
        <p className="text-sm text-muted-foreground">첫 체험단을 만들어 브랜드를 알리고 지원자를 모아보세요.</p>
      </div>
    </CardContent>
    <CardFooter className="justify-center pb-6">
      <Button asChild>
        <Link href="/advertiser/campaigns/new" className="flex items-center gap-1">
          체험단 등록 시작하기
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function AdvertiserCampaignsPage() {
  const { data, isLoading } = useAdvertiserCampaigns(1, 20);
  const deleteMutation = useDeleteCampaign();
  const campaigns = useMemo(() => data?.campaigns ?? [], [data]);
  const deleteError = deleteMutation.isError
    ? deleteMutation.error instanceof Error
      ? deleteMutation.error.message
      : '체험단 삭제에 실패했습니다.'
    : null;

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

  const handleDelete = async (campaignId: string) => {
    const confirmed = window.confirm('체험단을 삭제하면 지원자 정보도 함께 삭제됩니다. 계속하시겠습니까?');
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(campaignId);
    } catch (error) {
      // 에러는 deleteError에서 노출
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">내 체험단</h1>
        <Button asChild>
          <Link href="/advertiser/campaigns/new">체험단 등록</Link>
        </Button>
      </div>

      {deleteError && (
        <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{deleteError}</div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y rounded border">
          {campaigns.map((campaign) => {
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === campaign.id;
            return (
              <li key={campaign.id} className="p-3 space-y-2">
                <Link
                  href={`/advertiser/campaigns/${campaign.id}/admin`}
                  className="flex items-center gap-3 rounded-md p-3 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex-1 text-left">
                    <div className="font-medium">{campaign.title}</div>
                    <div className="text-sm text-muted-foreground">
                      상태 {campaign.status} · 지원 {campaign.applicationCount}명 · 모집 {campaign.recruitmentCount}명
                    </div>
                  </div>
                  <span className="text-sm text-primary">상세 관리</span>
                </Link>
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/advertiser/campaigns/${campaign.id}/edit`}>정보 수정</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(campaign.id)}
                    disabled={isDeleting}
                  >
                    삭제
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}