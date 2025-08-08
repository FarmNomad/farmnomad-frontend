import { Card, CardContent } from "@/components/ui/card";

export default function DashboardCard({ title, value }: { title:string, value:string }) {
  return (
    <Card className="p-4 w-full md:w-1/3 bg-white shadow-lg rounded-lg">
      <CardContent>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
};
