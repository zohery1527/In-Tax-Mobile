import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const Chart = ({ type='bar', data=[], xKey, yKey, title }) => {
  const chartData = {
    labels: data.map(d=>d[xKey]),
    datasets: [{ label: title, data: data.map(d=>d[yKey]), backgroundColor:'rgba(59,130,246,0.5)', borderColor:'rgba(59,130,246,1)', borderWidth:1 }]
  };
  return type==='bar' ? <Bar data={chartData}/> : <Line data={chartData}/>;
};

export default Chart;
