'use client';

import Link from 'next/link';
import { useAdvertiserCampaigns } from '@/features/feature08-campaign-create/hooks/useCampaignCreate';
import { Button } from '@/components/ui/button';

export default function AdvertiserCampaignsPage() {
  const { data, isLoading } = useAdvertiserCampaigns(1, 20);

  if (isLoading) return <div className="p-6">로딩중...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">내 체험단</h1>
        <Button asChild>
          <Link href="/advertiser/campaigns/new">체험단 생성</Link>
        </Button>
      </div>

      <ul className="divide-y rounded border">
        {data?.campaigns.map((c) => (
          <li key={c.id} className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{c.title}</div>
              <div className="text-sm text-gray-500">상태 {c.status} · 지원 {c.applicationCount}명 · 모집 {c.recruitmentCount}명</div>
            </div>
            <Button asChild variant="secondary">
              <Link href={`/advertiser/campaigns/${c.id}/admin`}>관리</Link>
            </Button>
          </li>
        ))}
        {data && data.campaigns.length === 0 && (
          <li className="p-3 text-sm text-gray-500">등록된 체험단이 없습니다.</li>
        )}
      </ul>
    </main>
  );
}


