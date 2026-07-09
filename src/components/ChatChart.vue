<template>
  <div class="chat-chart-wrapper">
    <div class="chart-title">{{ config.title }}</div>
    <div v-if="config.subtitle" class="chart-subtitle">{{ config.subtitle }}</div>
    <div ref="chartRef" class="chat-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  config: { type: Object, required: true }
})

const chartRef = ref()
let chartInstance = null

function buildOption(config) {
  const colors = ['#4f6ef7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const unit = config.valueUnit || ''
  const seriesName = config.series?.[0]?.name || '数值'

  if (config.type === 'pie') {
    const data = config.labels.map((label, i) => ({
      name: label,
      value: config.series[0]?.data[i] ?? 0
    }))
    return {
      color: colors,
      tooltip: {
        trigger: 'item',
        formatter: (params) => `${params.name}<br/>${seriesName}: ${params.value}${unit}<br/>占全部合计: ${params.percent}%`
      },
      legend: { bottom: 0, type: 'scroll' },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        data,
        label: {
          formatter: (params) => `${params.name}\n${params.value}${unit}\n占${params.percent}%`
        }
      }]
    }
  }

  const series = config.series.map((s, i) => ({
    name: s.name,
    type: config.type === 'line' ? 'line' : 'bar',
    data: s.data,
    smooth: config.type === 'line',
    itemStyle: { color: colors[i % colors.length] },
    barMaxWidth: 40,
    label: config.series.length === 1 ? {
      show: true,
      position: 'top',
      formatter: (params) => `${params.value}${unit}`
    } : undefined
  }))

  return {
    color: colors,
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        if (!Array.isArray(params)) return ''
        const header = params[0]?.axisValue ?? ''
        const lines = params.map(p => `${p.marker}${p.seriesName}: ${p.value}${unit}`)
        return [header, ...lines].join('<br/>')
      }
    },
    legend: config.series.length > 1 ? { bottom: 0 } : undefined,
    grid: { left: 48, right: 24, top: 24, bottom: config.series.length > 1 ? 48 : 32 },
    xAxis: {
      type: 'category',
      data: config.labels,
      axisLabel: { rotate: config.labels.length > 6 ? 30 : 0, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: unit ? `单位：${unit}` : '',
      nameTextStyle: { fontSize: 11, color: '#6b7280' },
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series
  }
}

function renderChart() {
  if (!chartRef.value || !props.config) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  chartInstance.setOption(buildOption(props.config), true)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(async () => {
  await nextTick()
  renderChart()
  window.addEventListener('resize', handleResize)
})

watch(() => props.config, async () => {
  await nextTick()
  renderChart()
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.chat-chart-wrapper {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8ecf0;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.chart-subtitle {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 8px;
}

.chat-chart {
  width: 100%;
  height: 280px;
}
</style>
