import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center gap-2 cursor-pointer whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-none bg-accent text-accent-text hover:bg-accent-hover",
        dark: "rounded-none bg-action-dark text-action-dark-text hover:opacity-90",
        outline:
          "rounded-none border border-border-strong bg-surface text-text-primary hover:bg-surface-elevated",
        ghost:
          "rounded-control text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
        danger: "rounded-none bg-danger text-danger-text hover:opacity-90",
        segment:
          "rounded-none text-text-secondary hover:bg-surface-elevated hover:text-text-primary",
        segmentActive: "rounded-none bg-accent text-accent-text",
      },
      size: {
        primary: "h-11 px-5 text-[0.875rem]",
        default: "h-10 px-4 text-[0.875rem]",
        compact: "h-8 px-3 text-label",
        icon: "size-9 rounded-icon px-0",
        row: "h-10 px-3 text-meta font-medium",
        profile: "h-11 px-2 text-meta font-medium",
      },
      align: {
        center: "justify-center",
        start: "justify-start text-left",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      align: "center",
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
  align,
  block,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, align, block }), className)}
      {...props}
    />
  );
}

export type IconButtonProps = Omit<ButtonProps, "size" | "align" | "block"> & {
  label: string;
};

export function IconButton({
  label,
  variant = "ghost",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size="icon"
      aria-label={label}
      title={label}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

export { buttonVariants };
