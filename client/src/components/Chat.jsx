import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, User, Send } from "lucide-react";
import type { ChatMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Chatbot() {
    const [messages, setMessages] = useState < ChatMessage[] > ([
        {
            id: "1",
            message:
                "Hello! I'm here to motivate and support you on your journey. How are you doing today?",
            isUser: false,
            timestamp: new Date(),
        },
    ]);

    const [input, setInput] = useState("");
    const messagesEndRef = useRef < HTMLDivElement > (null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessageMutation = useMutation({
        mutationFn: (message: string) =>
            apiRequest("POST", "/api/chatbot", { message }), // this will call your Express API
        onSuccess: async (response) => {
            const data = await response.json();
            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message: data.reply || "I'm here to help!",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
        },
        onError: () => {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                message:
                    "Sorry, I'm having trouble responding right now. Please try again!",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        },
    });

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            message: input,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const messageToSend = input;
        setInput("");
        sendMessageMutation.mutate(messageToSend);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            {/* Header */}
            <div className="border-b border-border p-4">
                <h1
                    className="text-2xl font-display font-bold"
                    data-testid="text-chatbot-title"
                >
                    Motivational Chatbot
                </h1>
                <p className="text-sm text-muted-foreground">
                    Your personal motivation assistant
                </p>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.isUser ? "justify-end" : "justify-start"
                            }`}
                        data-testid={`message-${msg.isUser ? "user" : "bot"}-${msg.id}`}
                    >
                        {!msg.isUser && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <Card
                            className={`max-w-[70%] p-4 ${msg.isUser
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-foreground"
                                }`}
                        >
                            <p className="text-sm">{msg.message}</p>
                            <p
                                className={`text-xs mt-2 ${msg.isUser
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                {msg.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </Card>
                        {msg.isUser && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-primary-foreground" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading dots when bot is typing */}
                {sendMessageMutation.isPending && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <Card className="p-4">
                            <div className="flex gap-1">
                                <div
                                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                />
                                <div
                                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                />
                                <div
                                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                />
                            </div>
                        </Card>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-border p-4 backdrop-blur-lg bg-background/90">
                <div className="max-w-4xl mx-auto flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                        data-testid="input-message"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={sendMessageMutation.isPending || !input.trim()}
                        data-testid="button-send"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
