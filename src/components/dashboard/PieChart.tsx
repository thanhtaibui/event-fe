import { PieChart } from "@mui/x-charts/PieChart";
import "../../styles/admin/dashboard.css";

interface DashboardData {
  label: string;
  value: number;
  color: string;
  hoverColor: string;
}

interface DashboardCardProps {
  title: string;
  data: DashboardData[];
}

function DashboardCard({ title, data }: DashboardCardProps) {
  const pieData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: item.color,
  }));

  return (
    <div className="pie-chart-card">
      <h3 className="chart-title">{title}</h3>
      <PieChart
        series={[
          {
            data: pieData,
            innerRadius: 60,
            outerRadius: 120,
            paddingAngle: 3,
            cornerRadius: 8,
          },
        ]}
        width={260}
        height={260}
      />
    </div>
  );
}

export default DashboardCard;
