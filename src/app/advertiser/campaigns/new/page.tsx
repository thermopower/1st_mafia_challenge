'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCampaign } from '@/features/feature08-campaign-create/hooks/useCampaignCreate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function NewCampaignPage() {
  const router = useRouter();
  const createMutation = useCreateCampaign();

  const [form, setForm] = useState({
    title: '',
    description: '',
    mission: '',
    benefits: '',
    location: '',
    recruitmentCount: 1,
    startDate: '',
    endDate: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'recruitmentCount' ? Number(value) : value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    router.replace('/');
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">체험단 생성</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input name="title" placeholder="제목" value={form.title} onChange={onChange} />
        <Textarea name="description" placeholder="설명" value={form.description} onChange={onChange} />
        <Textarea name="mission" placeholder="미션" value={form.mission} onChange={onChange} />
        <Textarea name="benefits" placeholder="혜택" value={form.benefits} onChange={onChange} />
        <Input name="location" placeholder="장소" value={form.location} onChange={onChange} />
        <Input name="recruitmentCount" type="number" min={1} value={form.recruitmentCount} onChange={onChange} />
        <div className="flex gap-2">
          <Input name="startDate" type="date" value={form.startDate} onChange={onChange} />
          <Input name="endDate" type="date" value={form.endDate} onChange={onChange} />
        </div>
        <Button type="submit" disabled={createMutation.isPending}>생성</Button>
      </form>
    </main>
  );
}


