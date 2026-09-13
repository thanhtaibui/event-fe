import React from "react";
import "../../../styles/admin/dashboard.css";

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon,
  trend,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        {icon && <div className="stat-icon">{icon}</div>}
        <span className="stat-trend">Live</span>
      </div>

      <span className="stat-title">{title}</span>
      <div className="stat-value">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {trend && <span className="stat-compare">{trend}</span>}
    </div>
  );
};

export default StatisticCard;
