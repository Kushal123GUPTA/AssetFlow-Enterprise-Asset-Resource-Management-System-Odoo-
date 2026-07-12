"use client";

import { Form, Input, Button, Alert } from "antd";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import AuthLogo from "@/app/modules/auth/components/AuthLogo";
import AuthSplitShell from "@/app/modules/auth/components/AuthSplitShell";

export default function SignupPage() {
  const { signup, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: {
    name: string;
    email: string;
    password: string;
  }) => {
    clearError();
    const ok = await signup(values);
    if (ok) {
      setSuccess(true);
      router.push("/dashboard");
    }
  };

  return (
    <AuthSplitShell
      panelTitle="Asset Management Information System"
      panelSubtitle="Create your employee account to track assets, book resources, and raise maintenance requests."
    >
      <AuthLogo align="start" className="mb-4" />

      <div className="mb-3">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h2>
        <p className="mt-1 text-xs text-slate-500 leading-snug">
          Signup creates an Employee account. An Admin assigns elevated roles later.
        </p>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-2 rounded-lg !py-1"
        />
      )}

      {success && (
        <Alert
          message="Account created! Logging you in..."
          type="success"
          showIcon
          className="mb-2 rounded-lg !py-1"
        />
      )}

      <Form
        name="signup_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="auth-compact-form"
        size="middle"
      >
        <Form.Item
          name="name"
          className="!mb-2.5"
          label={
            <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wider">
              Full Name
            </span>
          }
          rules={[{ required: true, message: "Please input your full name!" }]}
        >
          <Input placeholder="Enter full name" className="!rounded-lg !border-slate-200" />
        </Form.Item>

        <Form.Item
          name="email"
          className="!mb-2.5"
          label={
            <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wider">
              E-mail
            </span>
          }
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input placeholder="Enter e-mail" className="!rounded-lg !border-slate-200" />
        </Form.Item>

        <Form.Item
          name="password"
          className="!mb-3"
          label={
            <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wider">
              Password
            </span>
          }
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 8, message: "Password must be at least 8 characters!" },
          ]}
        >
          <Input.Password
            placeholder="Create password"
            className="!rounded-lg !border-slate-200"
          />
        </Form.Item>

        <Form.Item className="!mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            className="!h-10 !rounded-lg !bg-[#2563eb] hover:!bg-[#1d4ed8] !border-none !font-bold !tracking-wide uppercase"
          >
            Sign Up
          </Button>
        </Form.Item>
      </Form>

      <p className="text-center mt-4 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
          Sign in
        </Link>
      </p>
    </AuthSplitShell>
  );
}
