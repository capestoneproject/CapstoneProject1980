"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error: any) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message || "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 container max-w-4xl mx-auto p-4 py-8">
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <h1 className="text-3xl font-bold mb-8">Ask Your Question</h1>

        <div className="flex-1 space-y-4 overflow-y-auto pr-4 mb-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-lg font-medium">
                Welcome! How can I help you today?
              </p>
              <p className="text-sm text-muted-foreground">
                Ask me about transportation, government services, banking, and
                more.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex", {
                "justify-end": message.role === "user",
                "justify-start": message.role === "assistant",
              })}
            >
              <Card
                className={cn("p-4 max-w-[85%] shadow-sm", {
                  "bg-primary text-primary-foreground": message.role === "user",
                  "bg-muted": message.role === "assistant",
                })}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-4 max-w-[85%] shadow-sm bg-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-background pt-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about transportation, government services, banking..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
