import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Flame, Target, Brain, TrendingUp, Award } from "lucide-react";
import heroImage from "@assets/generated_images/Motivational_workspace_achievement_hero_a3883ba5.png";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const authenticated = isAuthenticated();

  const features = [
    {
      icon: Target,
      title: "Track Habits",
      description: "Build and maintain daily habits with our intuitive tracking system.",
    },
    {
      icon: Flame,
      title: "Build Streaks",
      description: "Keep your motivation high with streak counters and daily challenges.",
    },
    {
      icon: TrendingUp,
      title: "Earn XP",
      description: "Gain experience points for every completed task and level up your progress.",
    },
    {
      icon: Award,
      title: "Unlock Badges",
      description: "Achieve milestones and collect bronze, silver, and gold badges.",
    },
    {
      icon: Brain,
      title: "Mind Games",
      description: "Keep your brain sharp with quick, engaging memory and reaction games.",
    },
    {
      icon: Trophy,
      title: "Compete & Grow",
      description: "Challenge yourself daily and watch your achievements grow.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Motivational workspace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6" data-testid="text-hero-title">
            Transform Habits Into Achievements
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Build lasting habits, earn rewards, and level up your life with ACHEIVE AI's gamified productivity platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {authenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8" data-testid="button-go-to-dashboard">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8" data-testid="button-get-started">
                    Get Started
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button size="lg" variant="outline" className="text-lg px-8" data-testid="button-sign-in">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4" data-testid="text-features-title">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to keep you motivated and on track
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="hover-elevate transition-all duration-300 hover:-translate-y-1"
                  data-testid={`card-feature-${index}`}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!authenticated && (
        <section className="py-16 px-4 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Transform Your Habits?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who are already building better habits and achieving their goals.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8" data-testid="button-cta-signup">
                Start Your Journey
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
