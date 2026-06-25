import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdvisorFlow AI",
  description:
    "AdvisorFlow AI tells real estate and mortgage professionals who to contact today, why it matters, what to say, and how to follow up.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
