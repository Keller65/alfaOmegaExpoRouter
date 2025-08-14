export interface DashboardType {
  seller: {
    slpCode: number;
    slpName: string;
  };
  period: string;
  currency: string;
  mode: string;
  target: number;
  actual: number;
  progressPct: number;
  segments: {
    achieved: number;
    remaining: number;
    overAchievement: number;
  };
  centerLabel: {
    primary: string;
    secondary: string;
  };
  colorHints: any | null;
  lastUpdated: string;
}
