import { useEffect, useRef, type RefObject } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

/**
 * 将一个 div 元素与 ECharts 实例绑定。
 * 当 option 变化时自动更新图表；组件卸载时自动销毁实例。
 */
export function useECharts<T extends HTMLElement = HTMLDivElement>(
  option: EChartsOption,
  deps: unknown[] = [],
): RefObject<T> {
  const ref = useRef<T>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current);
    }
    chartRef.current.setOption(option, true);
    return undefined;
  }, deps);

  // 自适应大小
  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return ref;
}
