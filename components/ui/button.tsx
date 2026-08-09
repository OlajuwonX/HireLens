import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-none bg-accent text-accent-text hover:bg-accent-hover",
        dark: "rounded-none bg-action-dark text-action-dark-text hover:opacity-90",
        outline:
          "rounded-none border border-border-strong bg-surface text-text-primary hover:bg-surface-elevated",
        ghost:
          "rounded-control text-text-secondary hover:bg-surface-elevated hover:text-text-primary",
        danger: "rounded-none bg-danger text-white hover:opacity-90",
      },
      size: {
        primary: "h-11 px-5 text-[0.875rem]",
        default: "h-10 px-4 text-[0.875rem]",
        compact: "h-8 px-3 text-label",
        icon: "size-9 rounded-icon px-0",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
