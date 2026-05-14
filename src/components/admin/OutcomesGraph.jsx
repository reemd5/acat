import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COLORS = [
  "#2a6496", // primary-ish
  "#6b7280",
  "#9ca3af",
  "#d1d5db",
  "#a5b4fc",
  "#c7d2fe",
  "#86efac",
  "#fca5a5",
];

const OutcomesGraph = ({ soByYear }) => {
  const barsColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--secondary-color")
    .trim();

  const chartData = useMemo(() => {
    const labels = soByYear?.labels ?? [];
    const soData = soByYear?.so_data ?? {};
    const soKeys = Object.keys(soData);

    if (labels.length === 0 || soKeys.length === 0) return null;

    return {
      labels,
      datasets: soKeys.map((so, i) => ({
        label: so,
        data: soData[so],
        backgroundColor: i === 0 ? (barsColor || COLORS[0]) : COLORS[i] ?? COLORS[i % COLORS.length],
        borderRadius: 6,
      })),
    };
  }, [soByYear, barsColor]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: { backgroundColor: "#1f2937", titleColor: "#fff", bodyColor: "#fff" },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (v) => v + "%" },
        grid: { color: "#e5e7eb" },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col h-[340px] md:h-[380px] xl:h-[420px]">
      <p className="text-(--primary-color) font-bold text-lg mb-5">SO Performance by Year</p>
      <div className="flex-1">
        {chartData ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No data available.
          </div>
        )}
      </div>
    </div>
  );
};

export default OutcomesGraph;
