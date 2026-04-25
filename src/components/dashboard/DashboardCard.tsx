import React from "react";
import "../../styles/admin/dashboard.css";

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>

      <div className="stat-value">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
};

export default StatisticCard;
