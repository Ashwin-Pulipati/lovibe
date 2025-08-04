"use client"
import { useCurrentTheme } from "@/hooks/use-current-theme";
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

/**
 * Renders a centered user sign-up page with theme-aware appearance and custom card styling.
 *
 * The sign-up form adapts its appearance based on the current UI theme, applying a dark theme when appropriate and customizing the card's border, shadow, and corner radius.
 */
export default function Page() {
  const currentTheme = useCurrentTheme();
    return (
      <div className="flex flex-col max-w-3xl mx-auto w-full">
        <section className="space-y-6 pt-[16vh] 2xl:pt-48">
          <div className="flex flex-col items-center">
            <SignUp
              appearance={{
                baseTheme: currentTheme === "dark" ? dark : undefined,
                elements: {
                  cardBox: "border! shadow-none! rounded-lg!",
                }
              }}/>
          </div>
        </section>
      </div>
    );
}
