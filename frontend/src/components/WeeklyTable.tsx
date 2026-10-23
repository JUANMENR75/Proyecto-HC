import React from 'react';
import { ReporteMensualItem } from '@/pages/ReportesCombinados';
import MonthlyTable from './MonthlyTable';

interface Props {
  data: ReporteMensualItem[];
}

const WeeklyTable: React.FC<Props> = ({ data }) => {
  return <MonthlyTable data={data} />;
};

export default WeeklyTable;
