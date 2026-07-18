import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Shapeshifter — JD-to-Resume Tailoring Engine",
  description: "Optimize your resume for specific job descriptions truthfully with match scoring, gap analysis, and side-by-side comparison proof reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
