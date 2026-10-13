import { CAMPAIGN } from './data';

export type CampaignResources = { gold: number; elixir: number; dark?: number };
export type CampaignResource = 'gold' | 'elixir' | 'dark';
type ResourceSource = CampaignResources & { darkElixir?: number };
/** Native catalog rows use darkElixir; inventories use dark. Explicit zero means depleted. */
export const campaignAmount = (v: ResourceSource, key: CampaignResource) =>
  key === 'dark' ? (v.dark ?? v.darkElixir ?? 0) : v[key];
export const campaignResourceKeys = (v: ResourceSource): CampaignResource[] =>
  v.dark !== undefined || (v.darkElixir ?? 0) > 0 ? ['gold', 'elixir', 'dark'] : ['gold', 'elixir'];
export const campaignResources = (
  v: ResourceSource,
  includeDark = campaignResourceKeys(v).includes('dark'),
): CampaignResources => ({
  gold: v.gold,
  elixir: v.elixir,
  ...(includeDark ? { dark: campaignAmount(v, 'dark') } : {}),
});
/** Namespaces the authored valley's inventory; native maps need their own catalog. */
export interface CampaignLoot {
  catalog: 'valley-v1';
  remaining: CampaignResources[];
}
export function freshCampaignLoot(): CampaignLoot {
  return {
    catalog: 'valley-v1',
    remaining: CAMPAIGN.map(({ gold, elixir }) => ({ gold, elixir })),
  };
}
export function validCampaignResources(
  value: unknown,
  ceiling: ResourceSource,
  requireDark = false,
): value is CampaignResources {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as CampaignResources;
  return (
    (['gold', 'elixir'] as const).every(
      (k) => Number.isSafeInteger(v[k]) && v[k] >= 0 && v[k] <= ceiling[k],
    ) &&
    (v.dark === undefined
      ? !requireDark
      : Number.isSafeInteger(v.dark) && v.dark >= 0 && v.dark <= campaignAmount(ceiling, 'dark'))
  );
}
export function validCampaignLoot(value: unknown): value is CampaignLoot {
  if (!value || typeof value !== 'object') return false;
  const v = value as CampaignLoot;
  return (
    v.catalog === 'valley-v1' &&
    Array.isArray(v.remaining) &&
    v.remaining.length === CAMPAIGN.length &&
    CAMPAIGN.every((r, i) => validCampaignResources(v.remaining[i], r))
  );
}
