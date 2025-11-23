import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Calculator, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getUserId } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";

type GameType = "memory" | "reaction" | "math" | null;

export default function MindGames() {
  const { toast } = useToast();
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const userId = getUserId();

  const awardFocusXpMutation = useMutation({
    mutationFn: (xp: number) => apiRequest("POST", "/api/focus-xp", { xp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
    },
  });

  const handleGameComplete = (gameName: string, score: number, xpEarned: number) => {
    awardFocusXpMutation.mutate(xpEarned);
    toast({
      title: `${gameName} Complete!`,
      description: `Score: ${score} | Earned ${xpEarned} Focus XP!`,
    });
    setActiveGame(null);
  };

  const games = [
    {
      id: "memory" as const,
      title: "Memory Match",
      description: "Flip cards to find matching pairs. Train your memory!",
      icon: Brain,
      color: "text-chart-2",
    },
    {
      id: "reaction" as const,
      title: "Reaction Timer",
      description: "Click as fast as you can when the color changes!",
      icon: Zap,
      color: "text-warning",
    },
    {
      id: "math" as const,
      title: "Math Sprint",
      description: "Solve quick mental arithmetic problems against the clock!",
      icon: Calculator,
      color: "text-success",
    },
  ];

  if (activeGame === "memory") {
    return <MemoryMatchGame onComplete={(score) => handleGameComplete("Memory Match", score, 5)} onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === "reaction") {
    return <ReactionTimerGame onComplete={(score) => handleGameComplete("Reaction Timer", score, 3)} onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === "math") {
    return <MathSprintGame onComplete={(score) => handleGameComplete("Math Sprint", score, 10)} onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="text-mindgames-title">
            Mind Games
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Train your brain, stay sharp! Complete games to earn Focus XP.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <Card
                key={game.id}
                className="hover-elevate transition-all duration-300 hover:-translate-y-1"
                data-testid={`card-game-${game.id}`}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${game.color}`} />
                  </div>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => setActiveGame(game.id)}
                    data-testid={`button-play-${game.id}`}
                  >
                    Play Game
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MemoryMatchGame({ onComplete, onBack }: { onComplete: (score: number) => void; onBack: () => void }) {
  const [cards, setCards] = useState(() => {
    const symbols = ["🎯", "🎮", "🎨", "🎭", "🎪", "🎬", "🎵", "🎸"];
    const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    return deck.map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }));
  });
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].symbol === cards[second].symbol) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setFlippedIndices([]);

        if (newCards.every(card => card.matched)) {
          setTimeout(() => onComplete(Math.max(100 - moves * 5, 10)), 500);
        }
      } else {
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            <RotateCcw className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Moves</p>
            <p className="text-2xl font-bold" data-testid="text-moves">{moves}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`aspect-square rounded-lg text-4xl flex items-center justify-center transition-all duration-300 ${
                card.flipped || card.matched
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover-elevate active-elevate-2"
              }`}
              data-testid={`card-memory-${index}`}
            >
              {card.flipped || card.matched ? card.symbol : "?"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReactionTimerGame({ onComplete, onBack }: { onComplete: (score: number) => void; onBack: () => void }) {
  const [gameState, setGameState] = useState<"waiting" | "ready" | "go" | "done">("waiting");
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);

  const startGame = () => {
    setGameState("ready");
    const delay = Math.random() * 3000 + 2000;
    setTimeout(() => {
      setGameState("go");
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (gameState === "go") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState("done");
      const score = Math.max(1000 - time, 100);
      setTimeout(() => onComplete(score), 1000);
    } else if (gameState === "ready") {
      setGameState("waiting");
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={onBack} className="mb-8" data-testid="button-back">
          <RotateCcw className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-12">
          <div className="text-center space-y-6">
            {gameState === "waiting" && (
              <>
                <h2 className="text-3xl font-display font-bold">Test Your Reaction Speed</h2>
                <p className="text-muted-foreground">Click the button when it turns green!</p>
                <Button size="lg" onClick={startGame} data-testid="button-start-reaction">
                  Start Game
                </Button>
              </>
            )}

            {gameState === "ready" && (
              <div
className="h-64 bg-destructive rounded-lg flex items-center justify-center cursor-pointer"
                onClick={handleClick}
                data-testid="area-ready"
              >
                <p className="text-2xl font-bold text-white">Wait for green...</p>
              </div>
            )}

            {gameState === "go" && (
              <div
                className="h-64 bg-success rounded-lg flex items-center justify-center cursor-pointer animate-pulse"
                onClick={handleClick}
                data-testid="area-go"
              >
                <p className="text-3xl font-bold text-white">CLICK NOW!</p>
              </div>
            )}

            {gameState === "done" && (
              <>
                <Trophy className="w-24 h-24 mx-auto text-warning" />
                <h2 className="text-4xl font-display font-bold">{reactionTime}ms</h2>
                <p className="text-muted-foreground">
                  {reactionTime < 300 ? "Lightning fast! ⚡" : reactionTime < 500 ? "Great reflexes! 👍" : "Good effort! 💪"}
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MathSprintGame({ onComplete, onBack }: { onComplete: (score: number) => void; onBack: () => void }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [question, setQuestion] = useState({ a: 0, b: 0, op: "+", answer: 0 });
  const [userAnswer, setUserAnswer] = useState("");

  const generateQuestion = () => {
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    let answer = 0;

    switch (op) {
      case "+":
        answer = a + b;
        break;
      case "-":
        answer = a - b;
        break;
      case "*":
        answer = a * b;
        break;
    }

    setQuestion({ a, b, op, answer });
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setTimeLeft(30);
    generateQuestion();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameStarted(false);
          onComplete(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer) === question.answer) {
      setScore(score + 10);
      generateQuestion();
      setUserAnswer("");
    } else {
      setUserAnswer("");
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            <RotateCcw className="w-4 h-4 mr-2" />
            Back
          </Button>
          {gameStarted && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Time Left</p>
              <p className={`text-2xl font-bold ${timeLeft < 10 ? "text-destructive" : "text-success"}`} data-testid="text-time">
                {timeLeft}s
              </p>
            </div>
          )}
        </div>

        <Card className="p-12">
          <div className="text-center space-y-6">
            {!gameStarted && timeLeft === 30 ? (
              <>
                <h2 className="text-3xl font-display font-bold">Math Sprint Challenge</h2>
                <p className="text-muted-foreground">Solve as many problems as you can in 30 seconds!</p>
                <Button size="lg" onClick={startGame} data-testid="button-start-math">
                  Start Game
                </Button>
              </>
            ) : gameStarted ? (
              <>
                <div className="text-6xl font-bold mb-8" data-testid="text-question">
                  {question.a} {question.op} {question.b} = ?
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full text-center text-3xl p-4 rounded-lg bg-card border-2 border-border focus:border-primary focus:outline-none"
                    placeholder="Your answer"
                    autoFocus
                    data-testid="input-answer"
                  />
                  <p className="text-2xl font-bold text-primary" data-testid="text-score">Score: {score}</p>
                </form>
              </>
            ) : (
              <>
                <Trophy className="w-24 h-24 mx-auto text-warning" />
                <h2 className="text-4xl font-display font-bold">Final Score: {score}</h2>
                <p className="text-muted-foreground">
                  {score >= 100 ? "Math genius! 🧮" : score >= 50 ? "Well done! 📊" : "Keep practicing! 📈"}
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
