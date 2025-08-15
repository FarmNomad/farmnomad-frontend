import DashboardCard from "@/components/cards/DashboardCard";
import Sidebar from "@/components/Sidebar";

export default function Page() {
  return (
    <div>
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="ml-64 p-6 flex-1">
          <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

          {/* Dashboard Stats */}
          <div className="flex flex-wrap gap-4">
            <DashboardCard title="Total Orders" value="125" />
            <DashboardCard title="Pending Deliveries" value="8" />
            <DashboardCard title="Total Revenue" value="$12,500" />
          </div>
        </div>
      </div>
    </div>
  );
}
