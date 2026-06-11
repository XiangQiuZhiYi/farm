import type { SaveApi } from './save';

declare global {
  interface Window {
    saveAPI?: SaveApi;
  }
}

export {};
