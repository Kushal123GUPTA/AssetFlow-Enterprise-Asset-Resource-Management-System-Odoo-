"use client";

import { Form, Input, Button, Alert } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import AuthLogo from "@/app/modules/auth/components/AuthLogo";

export default function SignupPage() {
  const { signup, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: any) => {
    clearError();
    const success = await signup(values);
    if (success) {
      setSuccess(true);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100 relative z-10">
        <div className="flex flex-col items-center">
          <AuthLogo className="mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-xs text-slate-400 text-center font-medium leading-relaxed max-w-sm">
            Admin role goes to the first account created. Employee accounts are created for existing organizations.
          </p>
        </div>

        <div className="mt-8">
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              className="mb-4 rounded-xl"
            />
          )}
          
          {success && (
            <Alert
              message="Account created successfully! Logging you in..."
              type="success"
              showIcon
              className="mb-4 rounded-xl"
            />
          )}

          <Form
            name="signup_form"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="space-y-4"
          >
            <Form.Item
              name="organizationName"
              label={<span className="text-slate-700 font-bold text-xs uppercase tracking-wider">Organization Name</span>}
              rules={[{ required: true, message: "Please input your organization name!" }]}
              className="mb-3"
            >
              <Input
                prefix={<BankOutlined className="text-slate-400 mr-2" />}
                placeholder="e.g. Acme Corporation"
                className="py-2.5 rounded-xl border-slate-200 hover:border-primary focus:border-primary"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="name"
              label={<span className="text-slate-700 font-bold text-xs uppercase tracking-wider">Full Name</span>}
              rules={[{ required: true, message: "Please input your full name!" }]}
              className="mb-3"
            >
              <Input
                prefix={<UserOutlined className="text-slate-400 mr-2" />}
                placeholder="John Doe"
                className="py-2.5 rounded-xl border-slate-200 hover:border-primary focus:border-primary"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span className="text-slate-700 font-bold text-xs uppercase tracking-wider">Email Address</span>}
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
              className="mb-3"
            >
              <Input
                prefix={<MailOutlined className="text-slate-400 mr-2" />}
                placeholder="john@example.com"
                className="py-2.5 rounded-xl border-slate-200 hover:border-primary focus:border-primary"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-slate-700 font-bold text-xs uppercase tracking-wider">Password</span>}
              rules={[
                { required: true, message: "Please input your password!" },
                { min: 8, message: "Password must be at least 8 characters long!" }
              ]}
              className="mb-5"
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400 mr-2" />}
                placeholder="Create a password"
                className="py-2.5 rounded-xl border-slate-200 hover:border-primary focus:border-primary"
                size="large"
              />
            </Form.Item>

            <Form.Item className="mb-0 pt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                className="w-full !bg-primary hover:!bg-primary-hover !border-none !text-white h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/25 transition-all hover:scale-[1.01]"
              >
                Sign Up
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500 font-medium">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary hover:text-primary-hover transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
