import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Flame, TrendingUp, Award, Sparkles } from "lucide-react";
import { getUserId } from "@/lib/auth";
import type { User, Badge } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";

const badges: Badge[] = [
  { type: "bronze", name: "Bronze Achiever", description: "Earn 100 XP", xpRequired: 100, earned: false },
  { type: "silver", name: "Silver Champion", description: "Earn 500 XP", xpRequired: 500, earned: false },
  { type: "gold", name: "Gold Master", description: "Earn 1000 XP", xpRequired: 1000, earned: false },
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const userId = getUserId();

  useEffect(() => {
    if (!userId) {
      setLocation("/signin");
    }
  }, [userId, setLocation]);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user", userId],
    enabled: !!userId,
  });

  if (!userId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="animate-pulse">
            <CardHeader className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted" />
              <div className="h-8 bg-muted rounded w-48 mx-auto mb-2" />
              <div className="h-4 bg-muted rounded w-32 mx-auto" />
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-chart-1",
      "bg-chart-2",
      "bg-chart-3",
      "bg-chart-4",
      "bg-chart-5",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const userBadges = badges.map((badge) => ({
    ...badge,
    earned: (user?.xp || 0) >= badge.xpRequired,
  }));

  const stats = [
    {
      icon: Trophy,
      label: "Level",
      value: user?.level || 1,
      color: "text-warning",
    },
    {
      icon: TrendingUp,
      label: "Total XP",
      value: user?.xp || 0,
      color: "text-primary",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: `${user?.streak || 0} days`,
      color: "text-destructive",
    },
    {
      icon: Sparkles,
      label: "Focus XP",
      value: user?.focusXp || 0,
      color: "text-xp",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card>
          <CardHeader className="text-center">
            <Avatar className={`w-24 h-24 mx-auto mb-4 ${getAvatarColor(user?.username || "User")}`}>
              <AvatarFallback className="text-2xl font-bold text-white">
                {getInitials(user?.username || "User")}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-display font-bold" data-testid="text-username">
              {user?.username}
            </h1>
            <p className="text-muted-foreground" data-testid="text-email">{user?.email}</p>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover-elevate transition-all" data-testid={`stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
                <CardContent className="pt-6 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userBadges.map((badge) => (
                <div
                  key={badge.type}
                  className={`flex flex-col items-center p-6 rounded-lg border transition-all ${
                    badge.earned
                      ? "border-primary bg-primary/5"
                      : "border-border opacity-50"
                  }`}
                  data-testid={`profile-badge-${badge.type}`}
                >
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                      badge.earned ? `bg-${badge.type}` : "bg-muted"
                    }`}
                  >
                    <Trophy
                      className={`w-10 h-10 ${
                        badge.earned ? "text-white" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {badge.description}
                  </p>
                  {badge.earned && (
                    <p className="text-xs text-success font-medium mt-2">Unlocked ✓</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Next Badge Progress</span>
                <span className="text-sm text-muted-foreground">
                  {user?.xp || 0} / {userBadges.find(b => !b.earned)?.xpRequired || 1000} XP
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      ((user?.xp || 0) / (userBadges.find(b => !b.earned)?.xpRequired || 1000)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep completing habits and playing mind games to earn more XP and unlock all badges!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
