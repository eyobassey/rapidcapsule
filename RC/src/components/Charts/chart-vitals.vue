<template>
  <div class="chart-wrapper">
    <canvas ref="chartEl"></canvas>
    <div v-if="error" class="chart-error">
      <span>Unable to display chart</span>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import Chart from "chart.js/auto";

// Register custom background plugin
Chart.register({
  id: "customBackground",
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
});

// Vital-specific configurations
const getVitalConfig = (vitalName, data) => {
  const configs = {
    "Blood Pressure": {
      type: "line",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 16,
              font: { size: 12, weight: "500" },
            },
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleFont: { size: 13, weight: "600" },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y} mmHg`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: "#64748B" },
          },
          y: {
            min: 40,
            max: 180,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: {
              font: { size: 11 },
              color: "#64748B",
              stepSize: 20,
            },
          },
        },
        elements: {
          line: { tension: 0.3, borderWidth: 3 },
          point: { radius: 5, hoverRadius: 7, borderWidth: 2, backgroundColor: "#fff" },
        },
      },
    },

    "Body Temperature": {
      type: "bar",
      options: (() => {
        const values = data?.datasets?.[0]?.data?.flat?.() || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 36;
        const maxVal = validValues.length ? Math.max(...validValues) : 38;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => {
                  if (Array.isArray(context.raw)) {
                    return `Range: ${context.raw[0]}°C - ${context.raw[1]}°C`;
                  }
                  return `Temperature: ${context.parsed.y}°C`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#64748B" },
            },
            y: {
              min: Math.max(35, minVal - 0.5),
              max: Math.min(42, maxVal + 0.5),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: {
                font: { size: 11 },
                color: "#64748B",
                callback: (value) => `${value}°C`,
              },
            },
          },
        };
      })(),
    },

    "Pulse Rate": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 60;
        const maxVal = validValues.length ? Math.max(...validValues) : 100;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => `Pulse: ${context.parsed.y} bpm`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#64748B" },
            },
            y: {
              min: Math.max(40, minVal - 10),
              max: Math.min(160, maxVal + 10),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: {
                font: { size: 11 },
                color: "#64748B",
              },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Blood Sugar Level": {
      type: "bar",
      options: (() => {
        const values = data?.datasets?.[0]?.data?.flat?.() || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 70;
        const maxVal = validValues.length ? Math.max(...validValues) : 120;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => {
                  if (Array.isArray(context.raw)) {
                    return `Range: ${context.raw[0]} - ${context.raw[1]} mg/dL`;
                  }
                  return `Blood Sugar: ${context.parsed.y} mg/dL`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#64748B" },
            },
            y: {
              min: Math.max(50, minVal - 20),
              max: Math.min(250, maxVal + 30),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: {
                font: { size: 11 },
                color: "#64748B",
              },
            },
          },
        };
      })(),
    },

    "Body Weight": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 50;
        const maxVal = validValues.length ? Math.max(...validValues) : 80;
        const padding = Math.max(5, (maxVal - minVal) * 0.2);
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => `Weight: ${context.parsed.y} kg`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#64748B" },
            },
            y: {
              min: Math.max(0, minVal - padding),
              max: maxVal + padding,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: {
                font: { size: 11 },
                color: "#64748B",
                callback: (value) => `${value} kg`,
              },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 5, hoverRadius: 7, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },
    "Blood Oxygen (SpO2)": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 95;
        const maxVal = validValues.length ? Math.max(...validValues) : 100;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => `SpO2: ${context.parsed.y}%`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: Math.max(85, minVal - 2),
              max: 100,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v}%` },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Steps": {
      type: "bar",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const maxVal = validValues.length ? Math.max(...validValues) : 10000;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => `Steps: ${context.parsed.y.toLocaleString()}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: 0,
              max: Math.ceil(maxVal * 1.2 / 1000) * 1000,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => v >= 1000 ? `${v/1000}k` : v },
            },
          },
        };
      })(),
    },

    "Sleep": {
      type: "bar",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            callbacks: {
              label: (context) => `Sleep: ${context.parsed.y} hours`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
          y: {
            min: 0,
            max: 12,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v}h` },
          },
        },
      },
    },

    "Calories Burned": {
      type: "bar",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const maxVal = validValues.length ? Math.max(...validValues) : 3000;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => `Calories: ${context.parsed.y.toLocaleString()} kcal`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: 0,
              max: Math.ceil(maxVal * 1.2 / 500) * 500,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B" },
            },
          },
        };
      })(),
    },

    "Distance": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const maxVal = validValues.length ? Math.max(...validValues) : 10;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => `Distance: ${context.parsed.y} km`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: 0,
              max: Math.ceil(maxVal * 1.3),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v} km` },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Respiratory Rate": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 12;
        const maxVal = validValues.length ? Math.max(...validValues) : 20;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: {
                label: (context) => `Resp Rate: ${context.parsed.y} breaths/min`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: Math.max(5, minVal - 3),
              max: Math.min(35, maxVal + 5),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B" },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Stress Level": {
      type: "line",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            callbacks: {
              label: (context) => `Stress: ${context.parsed.y}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 11 }, color: "#64748B" },
          },
        },
        elements: {
          line: { tension: 0.3, borderWidth: 3, fill: true },
          point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
        },
      },
    },

    "Body Fat": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 10;
        const maxVal = validValues.length ? Math.max(...validValues) : 30;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: { label: (context) => `Body Fat: ${context.parsed.y}%` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: Math.max(0, minVal - 5),
              max: Math.min(60, maxVal + 5),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v}%` },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Active Minutes": {
      type: "bar",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const maxVal = validValues.length ? Math.max(...validValues) : 60;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: { label: (context) => `Active: ${context.parsed.y} min` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: 0,
              max: Math.ceil(maxVal * 1.3 / 10) * 10,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v} min` },
            },
          },
        };
      })(),
    },

    "Hydration": {
      type: "bar",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const maxVal = validValues.length ? Math.max(...validValues) : 3;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: { label: (context) => `Water: ${context.parsed.y} L` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: 0,
              max: Math.ceil(maxVal * 1.3),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v} L` },
            },
          },
        };
      })(),
    },

    "Muscle Mass": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 40;
        const maxVal = validValues.length ? Math.max(...validValues) : 70;
        const padding = Math.max(3, (maxVal - minVal) * 0.2);
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: { label: (context) => `Muscle: ${context.parsed.y} kg` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: Math.max(0, minVal - padding),
              max: maxVal + padding,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v} kg` },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Bone Mass": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 2;
        const maxVal = validValues.length ? Math.max(...validValues) : 4;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: { label: (context) => `Bone: ${context.parsed.y} kg` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: Math.max(0, minVal - 1),
              max: maxVal + 1,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v} kg` },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Body Water": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 45;
        const maxVal = validValues.length ? Math.max(...validValues) : 65;
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: { label: (context) => `Body Water: ${context.parsed.y}%` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: Math.max(30, minVal - 5),
              max: Math.min(80, maxVal + 5),
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v}%` },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },

    "Visceral Fat": {
      type: "line",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            callbacks: { label: (context) => `Visceral Fat: Level ${context.parsed.y}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
          y: {
            min: 0,
            max: 20,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 11 }, color: "#64748B" },
          },
        },
        elements: {
          line: { tension: 0.3, borderWidth: 3, fill: true },
          point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
        },
      },
    },

    "BMR": {
      type: "line",
      options: (() => {
        const values = data?.datasets?.[0]?.data || [];
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        const minVal = validValues.length ? Math.min(...validValues) : 1200;
        const maxVal = validValues.length ? Math.max(...validValues) : 2000;
        const padding = Math.max(100, (maxVal - minVal) * 0.2);
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              callbacks: { label: (context) => `BMR: ${context.parsed.y} kcal` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748B" } },
            y: {
              min: Math.max(800, minVal - padding),
              max: maxVal + padding,
              grid: { color: "rgba(0,0,0,0.06)" },
              ticks: { font: { size: 11 }, color: "#64748B", callback: (v) => `${v} kcal` },
            },
          },
          elements: {
            line: { tension: 0.3, borderWidth: 3, fill: true },
            point: { radius: 4, hoverRadius: 6, borderWidth: 2, backgroundColor: "#fff" },
          },
        };
      })(),
    },
  };

  return configs[vitalName] || null;
};

export default {
  props: {
    chartData: {
      type: Object,
      required: true,
    },
    chartType: {
      type: String,
    },
    selectedVital: {
      type: String,
    },
    patientName: {
      type: String,
      default: "",
    },
  },

  setup(props) {
    const chartEl = ref(null);
    const chart = shallowRef(null);
    const error = ref(false);

    const destroyChart = () => {
      if (chart.value) {
        chart.value.destroy();
        chart.value = null;
      }
    };

    const createChart = () => {
      error.value = false;

      if (!chartEl.value) {
        console.warn('Chart element not ready');
        return;
      }

      if (!props.chartData?.datasets?.length) {
        console.warn('No chart data available');
        return;
      }

      try {
        destroyChart();

        const vitalConfig = getVitalConfig(props.selectedVital, props.chartData);
        const chartType = vitalConfig?.type || props.chartType || "bar";
        const options = vitalConfig?.options || getDefaultOptions();

        nextTick(() => {
          try {
            chart.value = new Chart(chartEl.value.getContext("2d"), {
              type: chartType,
              data: props.chartData,
              options: options,
            });
          } catch (err) {
            console.error('Error creating chart:', err);
            error.value = true;
          }
        });
      } catch (err) {
        console.error('Error in createChart:', err);
        error.value = true;
      }
    };

    const getDefaultOptions = () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "rgba(0,0,0,0.06)" } },
      },
    });

    const getChartData = function (shouldGetBase64Img) {
      if (!chart.value) return null;

      try {
        const base64Image = chart.value.toBase64Image();

        if (shouldGetBase64Img) {
          return base64Image;
        }

        const vitalName = props.selectedVital || "Vital";
        const patientName = props.patientName || "Patient";
        const date = new Date();
        const formattedDate = date.toISOString().split("T")[0];

        const sanitizedVital = vitalName.replace(/[^a-zA-Z0-9]/g, "_");
        const sanitizedPatient = patientName.replace(/[^a-zA-Z0-9]/g, "_");

        const downloadLink = document.createElement("a");
        downloadLink.href = base64Image;
        downloadLink.download = `${sanitizedPatient}_${sanitizedVital}_Trends_${formattedDate}.png`;
        downloadLink.click();
      } catch (err) {
        console.error('Error getting chart data:', err);
      }
    };

    watch(
      () => [props.chartData, props.selectedVital],
      () => {
        createChart();
      },
      { deep: true }
    );

    onMounted(() => {
      if (props.chartData?.datasets?.length) {
        createChart();
      }
    });

    onBeforeUnmount(() => {
      destroyChart();
    });

    return {
      chartEl,
      getChartData,
      error,
    };
  },
};
</script>

<style scoped lang="scss">
.chart-wrapper {
  width: 100%;
  height: 100%;
  min-height: 300px;
  position: relative;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}

.chart-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
  color: #64748B;
  font-size: 14px;
}
</style>
