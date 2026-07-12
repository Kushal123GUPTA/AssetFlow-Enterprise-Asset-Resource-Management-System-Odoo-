"use client";

import { Form, Input, Button, Alert } from "antd";
import { MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import AuthLogo from "@/app/modules/auth/components/AuthLogo";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <AuthLogo className="mb-6" />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-100">
            Forgot password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
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
          />
        )}

        {message && (
          <Alert
            message={message}
            type="success"
            showIcon
            description={
              resetPath ? (
                <div className="mt-2 space-y-3">
                  <p className="text-sm">
                    No email provider is configured in this environment. Use the
                    button below to set a new password (link expires in 1 hour).
                  </p>
                  <Button
                    type="primary"
                    onClick={() => router.push(resetPath)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to reset password
                  </Button>
                </div>
              ) : (
                <p className="text-sm mt-1">
                  If you don&apos;t see a continue option, no active account was
                  found for that email.
                </p>
              )
            }
          />
        )}

        {!resetPath && (
          <Form
            name="forgot_password"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="mt-4"
          >
            <Form.Item
              name="email"
              label={<span className="text-gray-700 font-medium">Email Address</span>}
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="you@example.com"
                className="py-2"
              />
            </Form.Item>

            <Form.Item className="mb-0 mt-4">
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-semibold"
                loading={loading}
                block
              >
                Continue
              </Button>
            </Form.Item>
          </Form>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
