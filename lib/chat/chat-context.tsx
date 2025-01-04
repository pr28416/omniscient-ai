"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { UserMessage } from "./schemas";
import { AssistantMessage } from "./schemas";

type Message = {
  userMessage: UserMessage;
  assistantMessage: AssistantMessage;
};

interface ChatContextType {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  addUserMessage: (content: string) => void;
  updateLatestAssistantMessage: (newAssistantMessage: AssistantMessage) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    // {
    //   userMessage: { content: "What is the best way to learn React?" },
    //   assistantMessage: {
    //     searchQueries: [
    //       "React tutorials",
    //       "React best practices",
    //       "Learn React for beginners",
    //     ],
    //     isDoneGeneratingSearchQueries: true,
    //     isDonePerformingSearch: true,
    //     searchResults: {
    //       web: {
    //         results: [
    //           {
    //             url: "https://react.dev/learn",
    //             title: "Quick Start – React Documentation",
    //             description:
    //               "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
    //             profile: {
    //               name: "React",
    //               img: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
    //             },
    //           },
    //           {
    //             url: "https://roadmap.sh/react",
    //             title: "React Developer Roadmap",
    //             description:
    //               "A comprehensive roadmap for learning React, including prerequisites and advanced concepts.",
    //             profile: {
    //               name: "React",
    //               img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
    //             },
    //           },
    //         ],
    //       },
    //     },
    //     isDoneProcessingSearchResults: true,
    //     processedSearchResults: [
    //       {
    //         scrapeStatus: "success",
    //         source: {
    //           url: "https://react.dev/learn",
    //           title: "Quick Start - React Documentation",
    //           summary:
    //             "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
    //           favicon: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
    //           sourceNumber: 1,
    //         },
    //       },
    //       {
    //         scrapeStatus: "error",
    //         source: {
    //           url: "https://roadmap.sh/react",
    //           title: "React Developer Roadmap",
    //           favicon:
    //             "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
    //           sourceNumber: 2,
    //         },
    //         error: "Error while reading: Testing error.",
    //       },
    //       {
    //         scrapeStatus: "in-progress",
    //         source: {
    //           url: "https://beta.reactjs.org/learn",
    //           title: "Learn React - Beta Documentation",
    //           favicon: "https://beta.reactjs.org/favicon.ico",
    //           sourceNumber: 3,
    //         },
    //       },
    //       {
    //         scrapeStatus: "not-started",
    //         source: {
    //           url: "https://react-tutorial.app",
    //           title: "Interactive React Tutorial",
    //           favicon:
    //             "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoRUg0l7PMuv1byhqZ90_i41rtCfjKYpjFeA&s",
    //           sourceNumber: 4,
    //         },
    //       },
    //     ],
    //   },
    // },
  ]);

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      userMessage: { content },
      assistantMessage: {
        isDoneGeneratingSearchQueries: false,
      },
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const updateLatestAssistantMessage = (
    newAssistantMessage: AssistantMessage
  ) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = { ...newMessages[newMessages.length - 1] };
      lastMessage.assistantMessage = {
        ...lastMessage.assistantMessage,
        ...newAssistantMessage,
      };
      newMessages[newMessages.length - 1] = lastMessage;
      console.log("Updated latest assistant message", lastMessage);
      return newMessages;
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        addUserMessage,
        updateLatestAssistantMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
