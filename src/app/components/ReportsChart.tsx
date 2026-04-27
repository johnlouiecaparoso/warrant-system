import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function ReportsChart({
  chartData,
}: {
  chartData: Array<{ id: string; status: string; count: number }>;
}) {
  const hasData = chartData.some((item) => item.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-[300px] place-items-center text-center text-sm text-gray-500">
            No warrant record data found for the selected report period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
