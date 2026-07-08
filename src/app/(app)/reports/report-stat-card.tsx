import { Card, CardContent } from "@/components/ui/card";

interface ReportStatCardProps {
  label: string;
  value: number;
  meta: string;
}

export function ReportStatCard({ label, value, meta }: ReportStatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="ui-meta">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="ui-meta-compact mt-1.5">{meta}</p>
      </CardContent>
    </Card>
  );
}
