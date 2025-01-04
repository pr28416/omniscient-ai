import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/lib/chat/chat-context";
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Product Lookup",
  description: "AI Product Lookup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} dark antialiased `}>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  );
}
