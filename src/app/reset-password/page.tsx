"use client";

import { Form, Input, Button, Alert } from "antd";
import { LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import axios from "axios";
import AuthLogo from "@/app/modules/auth/components/AuthLogo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onFinish = async (values: { password: string; confirm: string }) => {
    if (!token) {
      setError("Missing or invalid reset link. Request a new one from the login page.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post("/api/auth/reset-password", {
        token,
        password: values.password,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Could not reset password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Alert
        type="error"
        showIcon
        message="Invalid reset link"
        description={
          <span>
            This page needs a valid token.{" "}
            <Link href="/forgot-password" className="font-medium text-primary">
              Request a new password reset
            </Link>
            .
          </span>
        }
      />
    );
  }

  return (
    <>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {done && (
        <Alert
          message="Password updated! Redirecting to sign in…"
          type="success"
          showIcon
          className="mb-4"
        />
      )}

      {!done && (
        <Form
          name="reset_password"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item
            name="password"
            label={<span className="text-gray-700 font-medium">New password</span>}
            rules={[
              { required: true, message: "Please enter a new password!" },
              { min: 8, message: "Password must be at least 8 characters!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="New password"
              className="py-2"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            label={<span className="text-gray-700 font-medium">Confirm password</span>}
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirm password"
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
              Update password
            </Button>
          </Form.Item>
        </Form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <AuthLogo className="mb-6" />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-100">
            Set a new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Choose a new password for your AssetFlow account.
          </p>
        </div>

        <Suspense fallback={<p className="text-center text-gray-500 text-sm">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
