'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdvertiserCampaignDetail,
  useDeleteCampaign,
  useUpdateCampaign,
} from '@/features/feature08-campaign-create/hooks/useCampaignCreate';
import { extractApiErrorMessage, isAxiosError } from '@/lib/remote/api-client';

interface FormState {
  title: string;
  description: string;
  mission: string;
  benefits: string;
  location: string;
  recruitmentCount: number;
  startDate: string;
  endDate: string;
}

const toDateInputValue = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
};

const AccessDenied = () => (
  <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-6 text-center">
    <h1 className="text-2xl font-semibold">접근이 제한되었습니다</h1>
    <p className="text-sm text-muted-foreground">
      이 체험단을 수정할 수 있는 권한이 없습니다. 계정을 확인하거나 관리자에게 문의해주세요.
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

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const campaignId = (params?.id ?? '') as string;
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAdvertiserCampaignDetail(campaignId);
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    mission: '',
    benefits: '',
    location: '',
    recruitmentCount: 1,
    startDate: '',
    endDate: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      title: data.title,
      description: data.description,
      mission: data.mission,
      benefits: data.benefits,
      location: data.location,
      recruitmentCount: data.recruitmentCount,
      startDate: toDateInputValue(data.startDate),
      endDate: toDateInputValue(data.endDate),
    });
  }, [data]);

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'recruitmentCount' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaignId) return;
    setErrorMessage(null);
    updateMutation.reset();

    try {
      await updateMutation.mutateAsync({ campaignId, input: form });
      router.replace('/advertiser/campaigns');
    } catch (mutationError) {
      setErrorMessage(extractApiErrorMessage(mutationError, '체험단 수정에 실패했습니다.'));
    }
  };

  const handleDelete = async () => {
    if (!campaignId) return;
    const confirmed = window.confirm('체험단을 삭제하면 지원자 정보도 함께 삭제됩니다. 계속하시겠습니까?');
    if (!confirmed) return;

    setErrorMessage(null);
    deleteMutation.reset();

    try {
      await deleteMutation.mutateAsync(campaignId);
      router.replace('/advertiser/campaigns');
    } catch (mutationError) {
      setErrorMessage(extractApiErrorMessage(mutationError, '체험단 삭제에 실패했습니다.'));
    }
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

  const isSubmitting = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">체험단 정보 수정</h1>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            취소
          </Button>
          <Button variant="destructive" type="button" onClick={handleDelete} disabled={isDeleting}>
            삭제
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input name="title" placeholder="제목" value={form.title} onChange={onChange} required />
        <Textarea
          name="description"
          placeholder="설명"
          value={form.description}
          onChange={onChange}
          required
        />
        <Textarea
          name="mission"
          placeholder="미션"
          value={form.mission}
          onChange={onChange}
          required
        />
        <Textarea
          name="benefits"
          placeholder="혜택"
          value={form.benefits}
          onChange={onChange}
          required
        />
        <Input name="location" placeholder="주소" value={form.location} onChange={onChange} required />
        <Input
          name="recruitmentCount"
          type="number"
          min={1}
          value={form.recruitmentCount}
          onChange={onChange}
          required
        />
        <div className="flex gap-2">
          <Input name="startDate" type="date" value={form.startDate} onChange={onChange} required />
          <Input name="endDate" type="date" value={form.endDate} onChange={onChange} required />
        </div>
        <Button type="submit" disabled={isSubmitting || isDeleting}>
          저장
        </Button>
      </form>
    </main>
  );
}
