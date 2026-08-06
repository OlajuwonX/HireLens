import * as React from "react";
import { Button, type ButtonProps } from "./button";

export type AccessibleIconButtonProps = Omit<ButtonProps, "children" | "size"> & {
  label: string;
  icon: React.ReactNode;
};

export function AccessibleIconButton({
  label,
  icon,
  ...props
}: AccessibleIconButtonProps) {
  return (
    <Button size="icon" aria-label={label} title={label} {...props}>
      {icon}
    </Button>
  );
}
