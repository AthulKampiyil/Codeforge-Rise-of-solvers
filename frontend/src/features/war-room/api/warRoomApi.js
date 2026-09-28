import { apiClient } from '../../../shared/api/client.js';

export const getWarRoom = async (guildId) => {
  const { data } = await apiClient.get(`/war_room/${guildId}`);
  return data;
};
