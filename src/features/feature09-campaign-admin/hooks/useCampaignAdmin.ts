'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CampaignApplicantsResponseSchema } from '../backend/schema';

export const useCampaignApplicants = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaignApplicants', campaignId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/campaigns/${campaignId}/applicants`);
      return CampaignApplicantsResponseSchema.parse(data);
    },
    enabled: Boolean(campaignId),
  });
};

export const useUpdateCampaignStatus = (campaignId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { status: '모집종료' | '조기종료'; reason?: string }) => {
      const { data } = await apiClient.patch(`/api/campaigns/${campaignId}/status`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignApplicants', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['advertiserCampaigns'] });
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, '상태 변경에 실패했습니다.'));
    }
  });
};

export const useSelectInfluencers = (campaignId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { selectedInfluencerIds: string[] }) => {
      const { data } = await apiClient.post(`/api/campaigns/${campaignId}/selection`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignApplicants', campaignId] });
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, '선정 처리에 실패했습니다.'));
    }
  });
};


