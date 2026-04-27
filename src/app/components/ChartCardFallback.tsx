import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function ChartCardFallback({
  title,
  height = 260,
}: {
  title: string;
  height?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="animate-pulse rounded-2xl border border-dashed border-slate-200 bg-slate-50"
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
}
