// Re-export all domain stores for backward compatibility.
// New code should import from the specific store directly.
export { useConnectionStore } from './connectionStore';
export { useProductStore } from './productStore';
export { useOrderStore } from './orderStore';
export { useUserStore } from './userStore';
export { useBrandStore } from './brandStore';
export { useCategoryStore } from './categoryStore';
export { usePricingStore } from './pricingStore';
export { useStatsStore } from './statsStore';

// Facade hook that provides the same API as the old monolithic store.
// Consumers can migrate to individual stores over time.
import { useConnectionStore } from './connectionStore';
import { useProductStore } from './productStore';
import { useOrderStore } from './orderStore';
import { useUserStore } from './userStore';
import { useBrandStore } from './brandStore';
import { useCategoryStore } from './categoryStore';
import { usePricingStore } from './pricingStore';
import { useStatsStore } from './statsStore';

export const useDashboardStore = () => ({
  ...useConnectionStore(),
  ...useStatsStore(),
  ...useProductStore(),
  ...useOrderStore(),
  ...useUserStore(),
  ...useBrandStore(),
  ...useCategoryStore(),
  ...usePricingStore(),
});
