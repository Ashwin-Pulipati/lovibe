"use client";

import { useCurrentTheme } from "@/hooks/use-current-theme";
import { useAuth, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

interface UserControlProps {
  showName?: boolean;
  hasProAccess?: boolean;
}

export const UserControl = ({ showName }: UserControlProps) => {
  const currentTheme = useCurrentTheme();
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" });
  return (
    <div className="flex items-center gap-x-2">
      {hasProAccess && (
        <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
          Pro
        </span>
      )}
      <UserButton
        showName={showName}
        appearance={{
          elements: {
            userButtonBox: "rounded-md!",
            userButtonAvatarBox: "rounded-md! size-8!",
            userButtonTrigger: "rounded-md!",
          },
          baseTheme: currentTheme === "dark" ? dark : undefined,
        }}
      />
    </div>
  );
};
