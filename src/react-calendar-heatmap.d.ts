declare module 'react-calendar-heatmap' {
    import * as React from 'react';
  
    export interface HeatmapValue {
      date: string;
      count?: number;
    }
  
    export interface CalendarHeatmapProps {
      startDate: Date | string;
      endDate: Date | string;
      values: HeatmapValue[];
      showWeekdayLabels?: boolean;
      classForValue?: (value: HeatmapValue) => string;
      tooltipDataAttrs?: (value: HeatmapValue) => { [key: string]: string };
      titleForValue?: (value: HeatmapValue) => string;
      onClick?: (value: HeatmapValue) => void;
    }
  
    const CalendarHeatmap: React.FC<CalendarHeatmapProps>;
    export default CalendarHeatmap;
  }
  