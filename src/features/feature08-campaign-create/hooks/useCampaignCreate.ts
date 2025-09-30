'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CampaignCreateInputSchema, AdvertiserCampaignsResponseSchema } from '../backend/schema';

type CreateInput = typeof CampaignCreateInputSchema['_type'];

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const { data } = await apiClient.post('/api/campaigns', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertiserCampaigns'] });
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, '체험단 생성에 실패했습니다.'));
    }
  });
};

export const useAdvertiserCampaigns = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['advertiserCampaigns', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/advertiser/campaigns?page=${page}&limit=${limit}`);
      return AdvertiserCampaignsResponseSchema.parse(data);
    }
  });
};


