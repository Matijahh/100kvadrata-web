import { cn } from "@/lib/cn";
import type { FC, SVGProps } from "react";

/** An icon, a title, an optional explanation and action — the app's EmptyState. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  children,
  className,
}: {
  icon?: FC<SVGProps<SVGSVGElement>>;
  title: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {Icon ? <Icon width={72} height={72} className="mb-4 text-tab-inactive" aria-hidden /> : null}
      <p className="font-display text-lg text-text">{title}</p>
      {message ? <p className="mt-2 max-w-md text-sm text-text-muted">{message}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

/** Small centred spinner for loading panels. */
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-10", className)}>
      <span
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
    </div>
  );
}
