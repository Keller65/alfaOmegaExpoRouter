import BottomSheetWelcome from '@/components/BottomSheetWelcome/page';
import BottomSheetCart from '@/components/BottomSheetCart/page';
import GoalDonut from '@/components/Dashboard/GoalDonut';
import KPICard from '@/components/Dashboard/KPICard';
import { ScrollView, Text, View } from 'react-native';
import { useAppStore } from '@/state';
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

  const goal = { current: 52340, target: 75000 };
  const products = useAppStore((s) => s.products);

  return (
    <View className="flex-1 bg-white relative px-4">
      <ScrollView className="flex-1 bg-white" contentContainerClassName="gap-4">
        <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900">Dashboard</Text>

        <View className="flex-row flex-wrap justify-between gap-4">
          <KPICard title="Ventas" value={`$${kpis.totalVentas.toLocaleString()}`} delta={kpis.deltaVentas} subtitle="vs. semana ant." />
          <KPICard title="Tickets" value={kpis.tickets} delta={kpis.deltaTickets} subtitle="vs. semana ant." />
          <KPICard title="Promedio ticket" value={`$${kpis.promedioTicket.toLocaleString()}`} />
          <KPICard title="Margen" value={`${kpis.margen}%`} />
        </View>

        <GoalDonut current={goal.current} target={goal.target} />
      </ScrollView>

      <View className="absolute bottom-4 right-8 gap-3 items-end z-50">
        {products.length > 0 && (<BottomSheetCart />)}
      </View>

      {/* <BottomSheetWelcome /> */}
    </View>
  );
}