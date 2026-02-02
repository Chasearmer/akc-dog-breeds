import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKC Dog Breeds - Learn All 200+ Breeds",
  description: "Explore American Kennel Club dog breeds by group. Browse photos and test your knowledge with quiz mode.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
