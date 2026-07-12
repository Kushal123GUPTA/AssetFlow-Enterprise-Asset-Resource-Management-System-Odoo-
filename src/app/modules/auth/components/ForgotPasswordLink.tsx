"use client";

import Link from "next/link";

type Props = {
  className?: string;
};

export default function ForgotPasswordLink({ className = "" }: Props) {
  return (
    <Link
      href="/forgot-password"
      className={`font-medium text-primary hover:text-primary-hover ${className}`}
    >
      Forgot your password?
    </Link>
  );
}
