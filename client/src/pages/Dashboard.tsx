import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getToken, getUserId } from "@/lib/auth";
import { Trophy, Flame, Plus, CheckCircle, Edit, Trash2, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, User, Badge } from "@shared/schema";
import { useLocation } from "wouter";

const motivationalQuotes = [
  "Every small step counts towards your bigger goals!",
  "You're building something amazing, one habit at a time.",
  "Consistency is the key to success. Keep going!",
  "Your future self will thank you for the work you're doing today.",
  "Progress, not perfection. You've got this!",
  "Small habits lead to remarkable results.",
  "Believe in the power of daily improvement.",
];

const badges: Badge[] = [
  { type: "bronze", name: "Bronze Achiever", description: "Earn 100 XP", xpRequired: 100, earned: false },
  { type: "silver", name: "Silver Champion", description: "Earn 500 XP", xpRequired: 500, earned: false },
  { type: "gold", name: "Gold Master", description: "Earn 1000 XP", xpRequired: 1000, earned: false },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quote, setQuote] = useState("");
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitTitle, setHabitTitle] = useState("");
  const [habitDescription, setHabitDescription] = useState("");

  const userId = getUserId();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      setLocation("/signin");
      return;
    }
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
  }, [token, setLocation]);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user", userId],
    enabled: !!userId,
  });

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
    enabled: !!token,
  });

  const createHabitMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      apiRequest("POST", "/api/habits", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
      setHabitDialogOpen(false);
      setHabitTitle("");
      setHabitDescription("");
      toast({ title: "Success", description: "Habit created successfully!" });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title: string; description?: string }) =>
      apiRequest("PATCH", `/api/habits/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setHabitDialogOpen(false);
      setEditingHabit(null);
      setHabitTitle("");
      setHabitDescription("");
      toast({ title: "Success", description: "Habit updated successfully!" });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/habits/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({ title: "Success", description: "Habit deleted successfully!" });
    },
  });

  const completeHabitMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/habits/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
      toast({
        title: "Awesome!",
        description: "Habit completed! You earned XP!",
      });
    },
  });

  const handleSubmitHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHabit) {
      updateHabitMutation.mutate({
        id: editingHabit.id,
        title: habitTitle,
        description: habitDescription || undefined,
      });
    } else {
      createHabitMutation.mutate({
        title: habitTitle,
        description: habitDescription || undefined,
      });
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitTitle(habit.title);
    setHabitDescription(habit.description || "");
    setHabitDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingHabit(null);
    setHabitTitle("");
    setHabitDescription("");
    setHabitDialogOpen(true);
  };

  const currentLevel = user?.level || 1;
  const currentXp = user?.xp || 0;
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = (currentXp / xpForNextLevel) * 100;

  const userBadges = badges.map(badge => ({
    ...badge,
    earned: currentXp >= badge.xpRequired,
  }));

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  const activityData = last7Days.map(date => {
    const completedCount = habits.filter(h => 
      h.completedDates?.includes(date)
    ).length;
    return { date, count: completedCount };
  });

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2" data-testid="text-dashboard-title">
            Welcome back, {user?.username || "User"}!
          </h1>
          <p className="text-lg text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-warning" />
            {quote}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Trophy className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-level">{currentLevel}</div>
              <p className="text-xs text-muted-foreground">
                {currentXp} / {xpForNextLevel} XP
              </p>
              <Progress value={xpProgress} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <Flame className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-streak">{user?.streak || 0}</div>
              <p className="text-xs text-muted-foreground">days in a row</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus XP</CardTitle>
              <Sparkles className="w-4 h-4 text-xp" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-focus-xp">{user?.focusXp || 0}</div>
              <p className="text-xs text-muted-foreground">from mind games</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Badges
            </CardTitle>
            <CardDescription>Unlock achievements as you progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 flex-wrap">
              {userBadges.map((badge) => (
                <div
                  key={badge.type}
                  className={`flex flex-col items-center transition-all ${
                    badge.earned ? "opacity-100 scale-100" : "opacity-30 scale-90"
                  }`}
                  data-testid={`badge-${badge.type}`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      badge.earned
                        ? `bg-${badge.type} shadow-lg`
                        : "bg-muted"
                    }`}
                  >
                    <Trophy className={`w-8 h-8 ${badge.earned ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <p className="text-sm font-medium mt-2">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7-Day Activity</CardTitle>
            <CardDescription>Your habit completion over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-end h-32">
              {activityData.map((day, index) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-24">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        day.count > 0 ? "bg-success" : "bg-muted"
                      }`}
                      style={{ height: `${Math.max((day.count / Math.max(...activityData.map(d => d.count), 1)) * 100, 10)}%` }}
                      data-testid={`activity-bar-${index}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Habits */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold">Your Habits</h2>
            <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} data-testid="button-add-habit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Habit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingHabit ? "Edit Habit" : "Create New Habit"}</DialogTitle>
                  <DialogDescription>
                    {editingHabit ? "Update your habit details" : "Add a new habit to track"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitHabit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="habit-title">Title</Label>
                    <Input
                      id="habit-title"
                      value={habitTitle}
                      onChange={(e) => setHabitTitle(e.target.value)}
                      placeholder="e.g., Morning Exercise"
                      required
                      data-testid="input-habit-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habit-description">Description (optional)</Label>
                    <Textarea
                      id="habit-description"
                      value={habitDescription}
                      onChange={(e) => setHabitDescription(e.target.value)}
                      placeholder="Add details about your habit..."
                      data-testid="input-habit-description"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createHabitMutation.isPending || updateHabitMutation.isPending} data-testid="button-save-habit">
                    {editingHabit ? "Update Habit" : "Create Habit"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {habitsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : habits.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No habits yet. Start building your routine!</p>
              <Button onClick={openCreateDialog} data-testid="button-create-first-habit">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Habit
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map((habit) => (
                <Card
                  key={habit.id}
                  className="hover-elevate transition-all duration-300"
                  data-testid={`card-habit-${habit.id}`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between gap-2">
                      <span>{habit.title}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(habit)}
                          data-testid={`button-edit-habit-${habit.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteHabitMutation.mutate(habit.id)}
                          data-testid={`button-delete-habit-${habit.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    {habit.description && (
                      <CardDescription>{habit.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={habit.completed ? "outline" : "default"}
                      className="w-full"
                      onClick={() => completeHabitMutation.mutate(habit.id)}
                      disabled={habit.completed || completeHabitMutation.isPending}
                      data-testid={`button-complete-habit-${habit.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {habit.completed ? "Completed Today" : "Mark Complete"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      +{habit.xpReward} XP
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
