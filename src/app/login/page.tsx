"use client";

import { Form, Input, Button, Alert, Checkbox } from "antd";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import AuthLogo from "@/app/modules/auth/components/AuthLogo";
import AuthSplitShell from "@/app/modules/auth/components/AuthSplitShell";

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    clearError();
    const ok = await login(values);
    if (ok) {
      setSuccess(true);
      router.push("/dashboard");
    }
  };

  return (
    <AuthSplitShell>
      <AuthLogo align="start" className="mb-8" />

      <div className="mb-6">
        <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
          Welcome back !
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your login credentials to access your account
        </p>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-4 rounded-lg"
        />
      )}

      {success && (
        <Alert
          message="Login successful! Redirecting..."
          type="success"
          showIcon
          className="mb-4 rounded-lg"
        />
      )}

      <Form
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        initialValues={{ remember: true }}
      >
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
          <Input
            placeholder="Enter e-mail"
            size="large"
            className="!rounded-lg !border-slate-200"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <span className="text-slate-800 font-bold text-[11px] uppercase tracking-wider">
              Password
            </span>
          }
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password
            placeholder="Enter password"
            size="large"
            className="!rounded-lg !border-slate-200"
          />
        </Form.Item>

        <div className="flex items-center justify-between mb-6 -mt-1">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-sm text-slate-600">Remember Me</Checkbox>
          </Form.Item>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
          >
            Forgot password?
          </Link>
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            size="large"
            className="!h-11 !rounded-lg !bg-[#2563eb] hover:!bg-[#1d4ed8] !border-none !font-bold !tracking-wide uppercase"
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <p className="text-center mt-8 text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
          Sign up
        </Link>
      </p>
    </AuthSplitShell>
  );
}
