import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKC Dog Breeds - Learn All 200+ Breeds",
  description: "Explore American Kennel Club dog breeds by group. Browse photos and test your knowledge with quiz mode.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐕</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
