<template>
  <div class="chart">
    <canvas ref="chartEl" id="canvasId"></canvas>
  </div>
</template>

<script>
import { ref, shallowRef, computed, watch, nextTick } from "vue";
import Chart from "chart.js/auto";

Chart.register({
  id: "customBackground",
  beforeDraw: (chart, {}, {}) => {
    const ctx = chart.canvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#F7F7F7";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
});

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
      default: '',
    },
  },

  setup(props, { emit }) {
    const dataset = computed(() => {
      return props.chartData;
    });

    const typeOfChart = computed(() => {
      return !props.chartType ? "bar" : props.chartType;
    });

    const chartEl = ref(null);

    const chart = shallowRef(null);

    const getMinVal = function (data) {
      const spread = [...data];

      if (Array.isArray(spread[0])) {
        const transposedArray = spread[0].map((col, i) =>
          spread.map((row) => row[i])
        );

        return Math.min(...transposedArray[0]);
      } else {
        return Math.min(...spread);
      }
    };

    const getMaxVal = function (data) {
      const spread = [...data];

      if (Array.isArray(spread[0])) {
        const transposedArray = spread[0].map((col, i) =>
          spread.map((row) => row[i])
        );

        return Math.max(...transposedArray[1]);
      } else {
        return Math.max(...spread);
      }
    };

    const getChartData = function (shouldGetBase64Img) {
      const chartEl = this.$refs.chartEl;

      const _chart = Chart.getChart(chartEl);
      let base64Image = _chart.toBase64Image();

      const downloadLink = document.createElement("a");
      downloadLink.href = base64Image;

      if (shouldGetBase64Img) {
        return base64Image;
      }

      // Create professional filename
      const vitalName = props.selectedVital || 'Vital';
      const patientName = props.patientName || 'Patient';
      const date = new Date();
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

      // Sanitize names for filename (remove special characters)
      const sanitizedVital = vitalName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedPatient = patientName.replace(/[^a-zA-Z0-9]/g, '_');

      downloadLink.download = `${sanitizedPatient}_${sanitizedVital}_Trends_${formattedDate}.png`;
      downloadLink.click();
    };

    watch(
      [dataset, typeOfChart],
      ([newData, newChart], [oldData, oldChart]) => {
        const data = { ...newData };
        const type = newChart;

        const yMax = getMaxVal(data.datasets[0].data);
        const yMin = getMinVal(data.datasets[0].data);

        const yMinTrue = yMin == 0 ? 0 : yMin - 10;
        const yMaxTrue = yMax + 10;

        if (chart.value) {
          if (type == "line") {
            chart.value.destroy();

            nextTick(() => {
              chart.value = new Chart(chartEl.value.getContext("2d"), {
                type: type,
                data: data,
                options: {
                  animation: false,
                  responsive: true,
                  bezierCurve: false,
                  maintainAspectRatio: false,
                  plugins: {
                    customCanvasBackgroundColor: {
                      color: "#F7F7F7",
                    },
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      suggestedMin: yMinTrue,
                      suggestedMax: yMaxTrue,
                    },
                  },
                },
              });
            });

            return;
          }

          if (type == "bar") {
            chart.value.destroy();

            nextTick(() => {
              chart.value = new Chart(chartEl.value.getContext("2d"), {
                type: type,
                data: data,
                options: {
                  animation: false,
                  responsive: true,
                  bezierCurve: false,
                  maintainAspectRatio: false,
                  plugins: {
                    customCanvasBackgroundColor: {
                      color: "#F7F7F7",
                    },
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      suggestedMin: yMinTrue,
                      suggestedMax: yMaxTrue,
                    },
                  },
                },
              });
            });

            return;
          }

          chart.value.data = data;
          chart.value.update();
          return;
        }

        if (!chart.value) {
          nextTick(() => {
            chart.value = new Chart(chartEl.value.getContext("2d"), {
              type: type,
              data: data,
              options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    suggestedMin: yMinTrue,
                    suggestedMax: yMaxTrue,
                  },
                },
              },
            });
          });
        }
      },
      { deep: true }
    );

    return {
      chartEl,
      getChartData,
    };
  },
};
</script>

<style scoped lang="scss">
.chart {
  width: 100%;
  height: 22.5rem;
}

canvas {
  padding: $size-16 $size-8;
  background-color: $color-g-97;
}
</style>
