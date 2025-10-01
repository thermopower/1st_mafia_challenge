'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CampaignApplicantsResponseSchema } from '../lib/dto';

export const useCampaignApplicants = (campaignId: string) => {
  const enabled = Boolean(campaignId);

  return useQuery({
    queryKey: ['campaignApplicants', campaignId],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/campaigns/' + campaignId + '/applicants');
      return CampaignApplicantsResponseSchema.parse(data);
    },
    enabled,
    refetchInterval: enabled ? ((query) => (query.state.status === 'error' ? false : 5000)) : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
};

export const useUpdateCampaignStatus = (campaignId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { status: '모집종료' | '조기종료'; reason?: string }) => {
      const { data } = await apiClient.patch('/api/campaigns/' + campaignId + '/status', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignApplicants', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['advertiserCampaigns'] });
    }
  });
};

export const useSelectInfluencers = (campaignId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { selectedInfluencerIds: string[] }) => {
      const { data } = await apiClient.post('/api/campaigns/' + campaignId + '/selection', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignApplicants', campaignId] });
    }
  });
};

export const useRejectInfluencers = (campaignId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { rejectedInfluencerIds: string[] }) => {
      const { data } = await apiClient.post('/api/campaigns/' + campaignId + '/rejection', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignApplicants', campaignId] });
    }
  });
};
