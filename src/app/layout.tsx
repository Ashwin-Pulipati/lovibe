import type { Metadata } from "next";
import { Quicksand, Iceberg } from "next/font/google";
import { ThemeProvider as NextJSThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/trpc/client";
import { ClerkProvider } from "@clerk/nextjs";
import "ldrs/react/Bouncy.css";

const quickSand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const iceberg = Iceberg({
  variable: "--font-iceberg",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lovibe",
    template: `%s - Lovibe`,
  },
  description:
    "An intelligent, sandboxed environment for building, testing, and collaborating on code with the power of AI. Perfect for developers, students, and teams.",
  keywords: [
    "code",
    "sandbox",
    "interpreter",
    "AI",
    "collaboration",
    "development",
    "testing",
    "Next.js",
    "React",
    "TypeScript",
  ],
  authors: [
    { name: "Ashwin Pulipati", url: "https://github.com/Ashwin-Pulipati" },
  ],
  creator: "Ashwin Pulipati",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lovibe.vercel.app/",
    title: "Lovibe",
    description:
      "An intelligent, sandboxed environment for building, testing, and collaborating on code with the power of AI.",
    siteName: "Lovibe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "oklch(0.58 0.23 336)",
        },
      }}
    >
      <TRPCReactProvider>
        <html lang="en" suppressHydrationWarning={true}>
          <body
            className={`${quickSand.variable} ${iceberg.variable} antialiased`}
          >
            <NextJSThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
              <Toaster />
              {children}
            </NextJSThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
