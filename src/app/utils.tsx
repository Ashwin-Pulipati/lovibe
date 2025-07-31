import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...customStylesUserPassedIn: ClassValue[]) => {
  return twMerge(clsx(customStylesUserPassedIn));
};
