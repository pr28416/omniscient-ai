"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/chat/chat-context";
import {
  Send,
  X,
  Pencil,
  ChevronLeft,
  Menu,
  PenSquare,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { AiResponseView } from "@/components/ui/chat/ai-response-view";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Home() {
  const {
    currentMessages: messages,
    setCurrentMessages: setMessages,
    generateAssistantResponse,
    currentSessionTitle,
    sessions,
    setCurrentSessionId,
    currentSessionId,
    setCurrentSessionTitle,
    createNewSession,
  } = useChat();
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  useEffect(() => {
    setInput("");
  }, [currentSessionId]);

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (query: string) => {
    cancelGeneration();

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
    action: () => void,
    content: string
  ) => {
    if (e.key === "Enter" && !e.shiftKey && content.trim().length > 0) {
      e.preventDefault();
      action();
    }
  };

  const handleTitleEdit = () => {
    if (editedTitle.trim()) {
      setCurrentSessionTitle(editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex flex-row h-screen bg-background">
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative h-full bg-background overflow-y-auto z-50",
          "transition-all duration-300 ease-in-out bg-card",
          isSidebarOpen
            ? "w-80 translate-x-0 p-4 border-r-2 border-border"
            : "w-0 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-12" />

        {/* Current Session Title */}
        <div className="flex items-center gap-2 mb-4">
          {isEditingTitle ? (
            <div className="flex w-full gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleEdit();
                  } else if (e.key === "Escape") {
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="h-8"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditingTitle(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleTitleEdit}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center">
              <h2
                className="font-semibold text-lg cursor-pointer hover:text-muted-foreground flex-1 text-primary dark:text-rose-500"
                onClick={() => {
                  setEditedTitle(currentSessionTitle);
                  setIsEditingTitle(true);
                }}
              >
                {currentSessionTitle}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditedTitle(currentSessionTitle);
                  setIsEditingTitle(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Current Session Messages */}
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center">
            No questions asked yet
          </p>
        ) : (
          <div className="space-y-2 mb-8">
            {messages.map((message, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => scrollToMessage(idx)}
                className={cn(
                  "w-full justify-start font-normal truncate text-left py-2",
                  activeMessageIndex === idx && "bg-accent"
                )}
              >
                <span className="truncate">{message.userMessage.content}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border my-4" />

        {/* Previous Sessions */}
        <h3 className="font-semibold mb-4">Previous Sessions</h3>
        <div className="space-y-2">
          {sessions.toReversed().map((session) => (
            <Button
              key={session.id}
              variant="outline"
              onClick={() => setCurrentSessionId(session.id)}
              className={cn(
                "w-full justify-start font-normal truncate text-left py-2",
                session.id === currentSessionId && "bg-accent"
              )}
            >
              <span className="truncate">{session.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content - add toggle button */}
      <div className="flex flex-col h-screen flex-1 relative">
        {/* Modified container for buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <div className="relative w-4 h-4">
              <Menu
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isSidebarOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
                )}
              />
              <ChevronLeft
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isSidebarOpen ? "opacity-100 scale-100" : "opacity-0 scale-0"
                )}
              />
            </div>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              createNewSession(true);
            }}
          >
            <PenSquare className="h-4 w-4" />
          </Button>
        </div>

        {!messages || messages.length === 0 ? (
          // Empty state content
          <div className="flex flex-col h-screen flex-1 items-center justify-center p-4 text-foreground">
            <div className="flex flex-col gap-8 items-center w-full max-w-xl">
              <h1 className="text-4xl font-bold tracking-tighter">
                Omniscient AI
              </h1>
              <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full p-2">
                <TextareaAutosize
                  className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxRows={3}
                  minRows={3}
                  onKeyDown={(e) =>
                    handleKeyPress(
                      e,
                      () => {
                        setInput("");
                        handleSubmit(input);
                      },
                      input
                    )
                  }
                />
                <div className="flex flex-col gap-2 justify-end">
                  <Button
                    variant={
                      isGenerating || input.length === 0
                        ? "secondary"
                        : "default"
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
        ) : (
          // Messages content - restructured
          <div className="flex flex-col h-screen flex-1">
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col px-4 sm:px-16 py-4 sm:py-8 pt-8 pb-0 w-full">
                <div className="w-full max-w-5xl">
                  <div className="h-8" />
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      data-message-index={idx}
                      className="flex flex-col w-full gap-8 h-auto min-h-fit"
                    >
                      {editingMessageIndex === idx ? (
                        <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full p-2 mt-8">
                          <TextareaAutosize
                            className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
                            value={editingMessageContent}
                            onChange={(e) =>
                              setEditingMessageContent(e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleKeyPress(
                                e,
                                () =>
                                  handleEditMessage(idx, editingMessageContent),
                                editingMessageContent
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
                          className="group relative w-full cursor-pointer mt-8"
                          onClick={() => {
                            setEditingMessageIndex(idx);
                            setEditingMessageContent(
                              message.userMessage.content
                            );
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
              </div>
            </div>

            {/* Search - moved outside the scroll container */}
            <div className="w-full p-8 pt-4 flex flex-row items-center">
              <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full max-w-5xl p-2">
                <TextareaAutosize
                  className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
                  placeholder="Ask a follow-up question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyPress(
                      e,
                      () => {
                        if (isGenerating) {
                          cancelGeneration();
                        } else if (input.length > 0) {
                          setInput("");
                          handleSubmit(input);
                        }
                      },
                      input
                    )
                  }
                  maxRows={2}
                  minRows={1}
                />
                <div className="flex flex-col gap-2 justify-end">
                  <Button
                    variant={
                      isGenerating || input.length === 0
                        ? "secondary"
                        : "default"
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
        )}
      </div>
    </div>
  );
}
