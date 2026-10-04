import { cn } from "@/lib/cn";
import type { ComponentProps, FC, SVGProps } from "react";

// Web counterpart of flatswipe/src/components/genericComponents/Button.tsx:
// the same pill, Cal Sans uppercase label and optional icon. Renders a <button>
// so it works in forms; links that should look like one use `buttonClasses`.

type ButtonVariant = "primary" | "secondary" | "ghost";

export const buttonClasses = ({
  variant = "primary",
  fullWidth = false,
}: { variant?: ButtonVariant; fullWidth?: boolean } = {}) =>
  cn(
    "relative inline-flex min-h-[46px] min-w-[170px] items-center justify-center gap-2 rounded-full px-[18px]",
    "font-display text-base uppercase tracking-[0.4px] transition-opacity",
    "hover:opacity-90 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" && "bg-primary text-text-on-primary",
    variant === "secondary" && "border-2 border-primary bg-transparent text-primary",
    variant === "ghost" && "min-w-0 bg-transparent text-primary normal-case",
    fullWidth && "w-full",
  );

type ButtonProps = Omit<ComponentProps<"button">, "children"> & {
  title: string;
  iconSvg?: FC<SVGProps<SVGSVGElement>>;
  iconAlignment?: "inline" | "right";
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

export default function Button({
  title,
  iconSvg: IconSvg,
  iconAlignment = "inline",
  fullWidth = false,
  variant = "primary",
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const icon = IconSvg ? <IconSvg width={16} height={16} aria-hidden /> : null;

  return (
    <button
      type={type}
      className={cn(
        buttonClasses({ variant, fullWidth }),
        iconAlignment === "right" && icon && "pr-[46px]",
        className,
      )}
      {...buttonProps}
    >
      <span>{title}</span>
      {iconAlignment === "inline" ? icon : null}
      {iconAlignment === "right" && icon ? (
        <span className="absolute inset-y-0 right-[18px] flex items-center">{icon}</span>
      ) : null}
    </button>
  );
}
