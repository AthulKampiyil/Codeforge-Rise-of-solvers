import { CAMPAIGN } from './data';
import { NATIVE_CAMPAIGN } from './native-campaign';
export type CampaignCatalog = 'valley-v1' | 'goblin-v1';
export const validCampaignCatalog = (v: unknown): v is CampaignCatalog | undefined =>
  v === undefined || v === 'valley-v1' || v === 'goblin-v1';
export const campaignStages = (catalog?: CampaignCatalog) =>
  catalog === 'goblin-v1' ? NATIVE_CAMPAIGN : CAMPAIGN;
export const campaignStage = (index: number, catalog?: CampaignCatalog) =>
  campaignStages(catalog)[index];
