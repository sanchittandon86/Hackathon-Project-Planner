import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  Calendar,
  Layers,
  History,
} from "lucide-react";

type DashboardCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
};

function DashboardCard({ icon, title, description, href }: DashboardCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-primary">{icon}</div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function Home() {
  const dashboardCards = [
    {
      icon: <Users size={24} />,
      title: "Employees",
      description: "Manage team members, designations, and employee information.",
      href: "/employees",
    },
    {
      icon: <ClipboardList size={24} />,
      title: "Tasks",
      description: "Create and manage project tasks, clients, and effort estimates.",
      href: "/tasks",
    },
    {
      icon: <Calendar size={24} />,
      title: "Leaves",
      description: "Track employee leave dates and manage the leave calendar.",
      href: "/leaves",
    },
    {
      icon: <Layers size={24} />,
      title: "Planner",
      description: "Generate and view project schedules with smart task assignments.",
      href: "/planner",
    },
    {
      icon: <History size={24} />,
      title: "Version History",
      description: "View plan changes, version history, and scheduling updates.",
      href: "/planner/versions",
    },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-6">Smart Project Planner</h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
          Manage resources, tasks, availability, planning, and track changes.
        </p>
      </div>

      {/* Grid Layout of Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card) => (
          <DashboardCard
            key={card.href}
            icon={card.icon}
            title={card.title}
            description={card.description}
            href={card.href}
          />
        ))}
      </div>
    </div>
  );
}
