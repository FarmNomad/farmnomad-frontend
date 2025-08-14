import Link from "next/link";
import { LayoutDashboard, Package, MessageSquare, Cloud, Users } from "lucide-react";

export default function Sidebar () {
  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-6 fixed">
      <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
      <nav className="space-y-4">
        <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80">
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </Link>
        <Link href="/dashboard/orders" className="flex items-center space-x-2 hover:opacity-80">
          <Package size={20} />
          <span>Orders</span>
        </Link>
        <Link href="/dashboard/messages" className="flex items-center space-x-2 hover:opacity-80">
          <MessageSquare size={20} />
          <span>Messages</span>
        </Link>
        <Link href="/dashboard/weather" className="flex items-center space-x-2 hover:opacity-80">
          <Cloud size={20} />
          <span>Weather</span>
        </Link>
        <Link href="/dashboard/users" className="flex items-center space-x-2 hover:opacity-80">
          <Users size={20} />
          <span>Users</span>
        </Link>
      </nav>
    </aside>
  );
};

