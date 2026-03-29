import { create } from 'zustand';
import type { PricingConfig } from '@/types/websocket';

interface PricingState {
  pricingConfig: PricingConfig | null;
  setPricingConfig: (config: PricingConfig) => void;
}

export const usePricingStore = create<PricingState>((set) => ({
  pricingConfig: null,
  setPricingConfig: (pricingConfig) => set({ pricingConfig }),
}));
