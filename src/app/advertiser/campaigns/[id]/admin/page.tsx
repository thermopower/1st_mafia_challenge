'use client';

import { useParams } from 'next/navigation';
import { useCampaignApplicants, useSelectInfluencers, useUpdateCampaignStatus } from '@/features/feature09-campaign-admin/hooks/useCampaignAdmin';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';

export default function CampaignAdminPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id as string;

  const { data, isLoading } = useCampaignApplicants(campaignId);
  const updateStatus = useUpdateCampaignStatus(campaignId);
  const selectMutation = useSelectInfluencers(campaignId);

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  if (isLoading || !data) return <div className="p-6">로딩중...</div>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">지원자 관리 - {data.campaignInfo.title}</h1>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => updateStatus.mutate({ status: '모집종료' })}>모집 종료</Button>
        <Button variant="destructive" onClick={() => updateStatus.mutate({ status: '조기종료' })}>조기 종료</Button>
        <Button onClick={() => selectMutation.mutate({ selectedInfluencerIds: selectedIds })} disabled={selectedIds.length === 0}>선정 처리</Button>
      </div>

      <ul className="divide-y rounded border">
        {data.applicants.map((a) => (
          <li key={a.id} className="p-3 flex items-center gap-3">
            <input type="checkbox" checked={Boolean(selected[a.influencerId])} onChange={() => toggle(a.influencerId)} />
            <div className="flex-1">
              <div className="font-medium">{a.influencerName} · {a.snsChannelName} · 팔로워 {a.followerCount.toLocaleString()}</div>
              <div className="text-sm text-gray-500">동기: {a.motivation}</div>
            </div>
            <div className="text-sm">{a.status}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}


