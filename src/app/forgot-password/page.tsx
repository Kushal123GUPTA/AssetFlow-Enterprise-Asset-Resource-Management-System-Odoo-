"use client";

import { Form, Input, Button, Alert } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import AuthLogo from "@/app/modules/auth/components/AuthLogo";
import AuthSplitShell from "@/app/modules/auth/components/AuthSplitShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetPath, setResetPath] = useState<string | null>(null);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetPath(null);
    try {
      const res = await axios.post("/api/auth/forgot-password", {
        email: values.email,
      });
      setMessage(res.data.message);
      if (res.data.resetPath) {
        setResetPath(res.data.resetPath);
      }
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      panelSubtitle="Reset your password securely to regain access to your AssetFlow workspace."
    >
      <AuthLogo align="start" className="mb-8" />

      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Forgot password
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your account email to continue resetting your password.
        </p>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4 rounded-lg"
        />
      )}

      {message && (
        <Alert
          message={message}
          type="success"
          showIcon
          className="mb-4 rounded-lg"
          description={
            resetPath ? (
              <div className="mt-2 space-y-3">
                <p className="text-sm">
                  Use the button below to set a new password (link expires in 1 hour).
                </p>
                <Button
                  type="primary"
                  onClick={() => router.push(resetPath)}
                  className="!bg-[#2563eb] hover:!bg-[#1d4ed8] !border-none"
                >
                  Continue to reset password
                </Button>
              </div>
            ) : (
              <p className="text-sm mt-1">
                If you don&apos;t see a continue option, no active account was found for that
                email.
              </p>
            )
          }
        />
      )}

      {!resetPath && (
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label={
              <span className="text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                E-mail
              </span>
            }
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter e-mail" size="large" className="!rounded-lg" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!h-11 !rounded-lg !bg-[#2563eb] hover:!bg-[#1d4ed8] !border-none !font-bold uppercase"
          >
            Continue
          </Button>
        </Form>
      )}

      <p className="text-center mt-8 text-sm text-slate-500">
        <Link href="/login" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
          Back to sign in
        </Link>
      </p>
    </AuthSplitShell>
  );
}
