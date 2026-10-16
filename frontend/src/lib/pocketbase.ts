import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8088';

// Singleton instance of PocketBase SDK
export const pb = new PocketBase(POCKETBASE_URL);

// Auto cancellation of duplicate requests can cause unexpected cancellations in Next.js dev mode / React 18 strict mode
pb.autoCancellation(false);
