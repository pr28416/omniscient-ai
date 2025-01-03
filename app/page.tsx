"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [input, setInput] = useState("");

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center p-4 text-foreground">
        <div className="flex flex-col gap-8 items-center w-full max-w-xl">
          <h1 className="text-3xl font-bold tracking-tighter">
            AI Product Lookup
          </h1>
          <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full p-2">
            <TextareaAutosize
              className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxRows={3}
              minRows={3}
            />
            <div className="flex flex-col gap-2 justify-end">
              <Button
                variant={
                  isGenerating || input.length === 0 ? "secondary" : "default"
                }
                size="icon"
                disabled={isGenerating || input.length === 0}
              >
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex flex-col h-screen bg-background">
        <h1>Hello World</h1>
      </div>
    </div>
  );
}
