"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MessageSquare,
  BookOpen,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalLessons: number;
  totalExercises: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return <p className="text-[var(--color-muted)]">Chargement...</p>;
  }

  const cards = [
    {
      icon: Users,
      label: "Utilisateurs",
      value: stats.totalUsers,
      color: "text-blue-500",
    },
    {
      icon: MessageSquare,
      label: "Conversations",
      value: stats.totalConversations,
      color: "text-green-500",
    },
    {
      icon: MessageCircle,
      label: "Messages",
      value: stats.totalMessages,
      color: "text-purple-500",
    },
    {
      icon: BookOpen,
      label: "Leçons",
      value: stats.totalLessons,
      color: "text-orange-500",
    },
    {
      icon: ClipboardCheck,
      label: "Exercices",
      value: stats.totalExercises,
      color: "text-pink-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <card.icon size={20} className={card.color} />
            <p className="text-2xl font-bold mt-2">{card.value}</p>
            <p className="text-xs text-[var(--color-muted)]">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="font-semibold">Derniers utilisateurs inscrits</h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {stats.recentUsers.map((user) => (
            <div key={user.id} className="px-4 py-3 flex justify-between">
              <div>
                <p className="text-sm font-medium">
                  {user.name ?? "Sans nom"}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {user.email}
                </p>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                {new Date(user.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ))}
          {stats.recentUsers.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
              Aucun utilisateur inscrit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
