import Link from "next/link";
import { type ButtonSize, type ButtonVariant, buttonClasses } from "./button";

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
