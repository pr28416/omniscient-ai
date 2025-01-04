"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/chat/chat-context";
import { Send, X, Pencil, Menu } from "lucide-react";
import { useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { AiResponseView } from "@/components/ui/chat/ai-response-view";
import { cn } from "@/lib/utils";

export default function Home() {
  const { messages, setMessages, generateAssistantResponse } = useChat();
  const [isGenerating, setIsGenerating] = useState(false);
  const [input, setInput] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(
    null
  );
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>(
    messages.length - 1
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (query: string) => {
    cancelGeneration();

    // Scroll to bottom immediately when submission starts
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsGenerating(true);
      await generateAssistantResponse(query, signal);
    } catch (error) {
      console.log(error);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleEditMessage = (index: number, newContent: string) => {
    cancelGeneration();

    // Reset the assistant message and remove subsequent messages
    const updatedMessages = messages.slice(0, index);

    // Update chat context with truncated messages
    setMessages(updatedMessages);

    // Reset editing state
    setEditingMessageIndex(null);
    setEditingMessageContent("");

    // Trigger new search with edited content
    handleSubmit(newContent);
  };

  const scrollToMessage = (index: number) => {
    const messageElements = document.querySelectorAll("[data-message-index]");
    const targetElement = messageElements[index];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
      setActiveMessageIndex(index);
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    action: () => void
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center p-4 text-foreground">
        <div className="flex flex-col gap-8 items-center w-full max-w-xl">
          <h1 className="text-3xl font-bold tracking-tighter">Omniscient AI</h1>
          <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full p-2">
            <TextareaAutosize
              className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxRows={3}
              minRows={3}
              onKeyDown={(e) =>
                handleKeyPress(e, () => {
                  setInput("");
                  handleSubmit(input);
                })
              }
            />
            <div className="flex flex-col gap-2 justify-end">
              <Button
                variant={
                  isGenerating || input.length === 0 ? "secondary" : "default"
                }
                size="icon"
                onClick={() => {
                  if (isGenerating) {
                    cancelGeneration();
                  } else {
                    setInput("");
                    handleSubmit(input);
                  }
                }}
              >
                {isGenerating ? <X /> : <Send />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-background z-50 transition-transform duration-300 ease-in-out border-r-2 border-border overflow-y-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "w-full max-w-md p-4 gap-2"
        )}
      >
        <div className="h-12" />
        {messages.map((message, idx) => (
          <Button
            key={idx}
            variant="ghost"
            onClick={() => {
              scrollToMessage(idx);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full justify-start font-normal text-wrap text-left py-6 flex",
              activeMessageIndex === idx && "bg-accent"
            )}
          >
            {message.userMessage.content}
          </Button>
        ))}
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu />
      </Button>

      {/* Main Content */}
      <div className="flex flex-col h-screen w-full items-center">
        {/* Content */}
        <div className="flex flex-col h-full bg-background px-4 pt-8 pb-0 w-full max-w-4xl overflow-y-auto gap-16">
          <div />
          {messages.map((message, idx) => (
            <div
              key={idx}
              data-message-index={idx}
              className="flex flex-col w-full gap-8 h-auto min-h-fit"
            >
              {editingMessageIndex === idx ? (
                <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full p-2">
                  <TextareaAutosize
                    className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
                    value={editingMessageContent}
                    onChange={(e) => setEditingMessageContent(e.target.value)}
                    onKeyDown={(e) =>
                      handleKeyPress(e, () =>
                        handleEditMessage(idx, editingMessageContent)
                      )
                    }
                    maxRows={3}
                    minRows={1}
                  />
                  <div className="flex flex-col gap-2 justify-end">
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() =>
                        handleEditMessage(idx, editingMessageContent)
                      }
                    >
                      <Send />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        setEditingMessageIndex(null);
                        setEditingMessageContent("");
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="group relative w-full cursor-pointer"
                  onClick={() => {
                    setEditingMessageIndex(idx);
                    setEditingMessageContent(message.userMessage.content);
                  }}
                >
                  <p className="w-full font-semibold tracking-tight text-4xl text-primary dark:text-rose-500">
                    {message.userMessage.content}
                  </p>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              )}
              <AiResponseView
                assistantMessage={message.assistantMessage}
                submitFollowUpSearchQueryCallback={(query) => {
                  handleSubmit(query);
                }}
              />
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="w-full p-4 pb-8 flex flex-row items-center justify-center">
          <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full max-w-4xl p-2">
            <TextareaAutosize
              className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
              placeholder="Ask a follow-up question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                handleKeyPress(e, () => {
                  if (isGenerating) {
                    cancelGeneration();
                  } else if (input.length > 0) {
                    setInput("");
                    handleSubmit(input);
                  }
                })
              }
              maxRows={2}
              minRows={1}
            />
            <div className="flex flex-col gap-2 justify-end">
              <Button
                variant={
                  isGenerating || input.length === 0 ? "secondary" : "default"
                }
                size="icon"
                onClick={() => {
                  if (isGenerating) {
                    cancelGeneration();
                  } else {
                    setInput("");
                    handleSubmit(input);
                  }
                }}
              >
                {isGenerating ? <X /> : <Send />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
