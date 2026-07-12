"use client";

import ForgotPasswordForm from "../components/ForgotPasswordForm";
import AuthLogo from "../components/AuthLogo";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <AuthLogo />
        <h2 className="text-center text-2xl font-extrabold text-gray-100">Forgot password</h2>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
