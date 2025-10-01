'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  AdvertiserCampaignsResponseSchema,
  CampaignCreateInputSchema,
  CampaignDeleteResponseSchema,
  CampaignDetailResponseSchema,
} from '../backend/schema';

type CampaignWriteInput = z.infer<typeof CampaignCreateInputSchema>;

type UpdateVariables = {
  campaignId: string;
  input: CampaignWriteInput;
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CampaignWriteInput) => {
      const { data } = await apiClient.post('/api/campaigns', input);
      return CampaignDetailResponseSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertiserCampaigns'] });
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, '체험단 생성에 실패했습니다.'));
    },
  });
};

export const useAdvertiserCampaigns = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['advertiserCampaigns', page, limit],
    queryFn: async () => {
      const endpoint = '/api/advertiser/campaigns?page=' + page + '&limit=' + limit;
      const { data } = await apiClient.get(endpoint);
      return AdvertiserCampaignsResponseSchema.parse(data);
    },
    refetchInterval: (query) => (query.state.status === 'error' ? false : 5000),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
};

export const useAdvertiserCampaignDetail = (campaignId: string) => {
  return useQuery({
    queryKey: ['advertiserCampaignDetail', campaignId],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/advertiser/campaigns/' + campaignId);
      return CampaignDetailResponseSchema.parse(data);
    },
    enabled: Boolean(campaignId),
    refetchOnWindowFocus: true,
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, input }: UpdateVariables) => {
      const { data } = await apiClient.patch('/api/campaigns/' + campaignId, input);
      return CampaignDetailResponseSchema.parse(data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['advertiserCampaigns'] });
      if (variables?.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['advertiserCampaignDetail', variables.campaignId] });
        queryClient.invalidateQueries({ queryKey: ['campaignApplicants', variables.campaignId] });
      }
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, '체험단 수정에 실패했습니다.'));
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data } = await apiClient.delete('/api/campaigns/' + campaignId);
      return CampaignDeleteResponseSchema.parse(data);
    },
    onSuccess: (_data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['advertiserCampaigns'] });
      if (campaignId) {
        queryClient.removeQueries({ queryKey: ['advertiserCampaignDetail', campaignId], exact: true });
        queryClient.invalidateQueries({ queryKey: ['campaignApplicants', campaignId] });
      }
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, '체험단 삭제에 실패했습니다.'));
    },
  });
};
