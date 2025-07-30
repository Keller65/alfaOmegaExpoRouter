// export default function TabIndex() {
//   return null; // O un texto introductorio si quieres
// }

import { useRouter } from 'expo-router';
import { useAppStore } from '@/state';
import { useEffect } from 'react';

export default function TabIndex() {
  const router = useRouter();
  const { selectedCustomer } = useAppStore();

  useEffect(() => {
    if (selectedCustomer) {
      router.replace('/explore');
    }
  }, [router, selectedCustomer]);

  return null
}