"use client";

import Link from "next/link";
import { CrownIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const ErrorPage = () => {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" });

  return (
    <div className="max-w-7xl mx-auto flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground font-sans">
      <div className="space-y-6">
        <h1 className="text-6xl font-serif font-bold text-primary animate-pulse">
          Global Error: Critical Failure
        </h1>
        <p className="max-w-xl mx-auto text-lg text-muted-foreground">
          A critical system error has occurred. Our creative data streams are
          down. Please try refreshing the page or navigating back to a safe
          zone.
          <br />
          <span className="mt-4 block text-xs text-secondary-foreground font-mono">
            This is a global fault. All systems are currently unresponsive.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-background bg-primary hover:bg-primary/90 shadow-md transition-all duration-300 transform hover:scale-105"
          >
            Go Home
          </Link>
          {!hasProAccess && (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary text-base font-medium rounded-full text-primary hover:text-background hover:bg-primary shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <CrownIcon className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
