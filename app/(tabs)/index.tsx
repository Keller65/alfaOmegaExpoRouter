import BottomSheetCart from '@/components/BottomSheetCart/page';
import BottomSheetWelcome from '@/components/BottomSheetWelcome/page';
import GoalDonut from '@/components/Dashboard/GoalDonut';
import KPICard from '@/components/Dashboard/KPICard';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import axios from 'axios';
import "../../global.css";

export default function App() {
  const kpis = {
    totalVentas: 52340,
    tickets: 312,
    promedioTicket: 168,
    margen: 34.5,
    deltaVentas: 8.3,
    deltaTickets: -2.1,
  };

  // Estado de métricas (donut)
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const [goalData, setGoalData] = useState<{
    current: number;
    target: number;
    progressPct?: number;
    currency?: string;
    centerLabelPrimary?: string;
    centerLabelSecondary?: string;
    lastUpdated?: string;
  } | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  async function fetchGoal() {
    if (!user?.token) return;
    const slpCode = user.salesPersonCode;
    setLoadingGoal(true);
    setGoalError(null);
    try {
      const url = `${fetchUrl}/api/Metrics/sales-progress/${slpCode}?mode=net`;
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
          'Content-Encoding': 'gzip'
        }
      });
      const d = res.data;
      setGoalData({
        current: d.actual ?? 0,
        target: d.target ?? 0,
        progressPct: d.progressPct,
        currency: d.currency,
        centerLabelPrimary: d.centerLabel?.primary,
        centerLabelSecondary: d.centerLabel?.secondary,
        lastUpdated: d.lastUpdated
      });
    } catch (e) {
      console.error('Error fetch goal', e);
      setGoalError('No se pudieron cargar los datos');
    } finally {
      setLoadingGoal(false);
    }
  }

  useEffect(() => {
    fetchGoal();
  }, [user?.token]);

  const goal = { current: goalData?.current || 0, target: goalData?.target || 0 };
  const products = useAppStore((s) => s.products);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoal().finally(() => {
      setRefreshKey((k) => k + 1);
      setRefreshing(false);
    });
  }, []);

  return (
    <View className="flex-1 bg-white relative px-4">

      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="gap-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900">Dashboard</Text>

        <View className="flex-row flex-wrap justify-between gap-4">
          <View className='flex-row gap-4 w-full'>
            <KPICard title="Ventas" value={`$${kpis.totalVentas.toLocaleString()}`} delta={kpis.deltaVentas} subtitle="vs. semana ant." />
            <KPICard title="Tickets" value={kpis.tickets} delta={kpis.deltaTickets} subtitle="vs. semana ant." />
          </View>
          <View className='flex-row gap-4 w-full'>
            <KPICard title="Promedio ticket" value={`$${kpis.promedioTicket.toLocaleString()}`} />
            <KPICard title="Margen" value={`${kpis.margen}%`} />
          </View>
        </View>

        <GoalDonut
          current={goal.current}
          target={goal.target}
          progressPct={goalData?.progressPct}
          currency={goalData?.currency}
          centerLabelPrimary={goalData?.centerLabelPrimary}
          centerLabelSecondary={goalData?.centerLabelSecondary}
          lastUpdated={goalData?.lastUpdated}
        />
      </ScrollView>

      <View className="absolute bottom-4 right-8 gap-3 items-end">
        {products.length > 0 && (<BottomSheetCart />)}
      </View>

      <BottomSheetWelcome />
    </View>
  );
}