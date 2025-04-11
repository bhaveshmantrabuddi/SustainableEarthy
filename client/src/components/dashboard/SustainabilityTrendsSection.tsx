import { useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area
} from "recharts";

// Mock data for now
const trendData = [
  { month: 'Apr', ecoScore: 58, carbonFootprint: 200 },
  { month: 'May', ecoScore: 60, carbonFootprint: 220 },
  { month: 'Jun', ecoScore: 65, carbonFootprint: 240 },
  { month: 'Jul', ecoScore: 70, carbonFootprint: 260 },
  { month: 'Aug', ecoScore: 69, carbonFootprint: 230 },
  { month: 'Sep', ecoScore: 72, carbonFootprint: 240 },
  { month: 'Oct', ecoScore: 75, carbonFootprint: 200 },
  { month: 'Nov', ecoScore: 78, carbonFootprint: 180 },
];

type TimeRange = 'Month' | 'Quarter' | 'Year';

export default function SustainabilityTrendsSection() {
  const [timeRange, setTimeRange] = useState<TimeRange>('Quarter');
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-neutral-200 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold font-heading text-neutral-800">Sustainability Trends</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 text-sm border border-neutral-300 rounded ${
              timeRange === 'Month' ? 'bg-primary text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            onClick={() => setTimeRange('Month')}
          >
            Month
          </button>
          <button 
            className={`px-3 py-1 text-sm border border-neutral-300 rounded ${
              timeRange === 'Quarter' ? 'bg-primary text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            onClick={() => setTimeRange('Quarter')}
          >
            Quarter
          </button>
          <button 
            className={`px-3 py-1 text-sm border border-neutral-300 rounded ${
              timeRange === 'Year' ? 'bg-primary text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
            onClick={() => setTimeRange('Year')}
          >
            Year
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="month" stroke="#757575" fontSize={12} />
            <YAxis stroke="#757575" fontSize={12} />
            <Tooltip />
            <Legend />
            <defs>
              <linearGradient id="ecoScoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="ecoScore" 
              stroke="#2E7D32" 
              fillOpacity={0.2}
              fill="url(#ecoScoreGradient)" 
              name="Eco Score"
            />
            <Line 
              type="monotone" 
              dataKey="carbonFootprint" 
              stroke="#00695C"
              strokeDasharray="5 5"
              name="Carbon Footprint"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xs text-neutral-600">Avg. Eco Score</p>
          <p className="text-lg font-semibold text-primary">72.4</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Improvement</p>
          <p className="text-lg font-semibold text-success">+14.8%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Carbon Saved</p>
          <p className="text-lg font-semibold text-secondary">36kg</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-600">Water Saved</p>
          <p className="text-lg font-semibold text-primary-light">0.4kL</p>
        </div>
      </div>
    </div>
  );
}
