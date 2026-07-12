"use client";

import { Form, Input, Button, Alert, Checkbox } from "antd";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: any) => {
    clearError();
    const success = await login(values);
    if (success) {
      setSuccess(true);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f1f5f9] justify-center items-center p-0 lg:p-4 relative overflow-hidden">
      
      {/* Premium Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-orange-200/25 blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-200/30 blur-[120px] z-0 pointer-events-none" />

      <div className="w-full max-w-6xl min-h-[100vh] lg:min-h-[85vh] bg-white rounded-none lg:rounded-3xl shadow-none lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10">
        
        {/* Left Pane (Image & Information block) - only visible on LG screens */}
        <div className="relative w-full lg:w-1/2 hidden lg:flex flex-col justify-center p-12 bg-cover bg-center overflow-hidden">
          {/* Background image & Overlay */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center" 
            style={{ backgroundImage: `url('/login_bg.png')` }}
          />
          <div className="absolute inset-0 bg-slate-950/70 z-0 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/80 z-0" />

          {/* Center Content: Marketing details */}
          <div className="relative z-10 space-y-4 max-w-lg">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Asset Management Information System
            </h1>
            <p className="text-white text-base font-semibold leading-relaxed opacity-90 max-w-md pt-2">
              Streamline tracking, optimize maintenance, and unlock resource efficiency across your enterprise.
            </p>
          </div>
        </div>

        {/* Right Pane (Login form block) */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-16 py-12 bg-white">
          <div className="w-full max-w-md space-y-7">
            
            {/* Header info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Image
                    src="/brand/icon.png"
                    alt="AssetFlow Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900 tracking-tight leading-none">AssetFlow</span>
                  <span className="text-[10px] font-bold text-slate-450 tracking-wider uppercase mt-1">Asset & Resource Management</span>
                </div>
              </div>
              
              <div className="space-y-1.5 pt-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back !
                </h2>
                <p className="text-sm text-slate-400 font-semibold">
                  Enter your login credentials to access your account
                </p>
              </div>
            </div>

            {/* Alert Notifications */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={clearError}
                className="rounded-xl font-bold"
              />
            )}
            
            {success && (
              <Alert
                message="Login successful! Redirecting..."
                type="success"
                showIcon
                className="rounded-xl font-bold"
              />
            )}

            {/* Ant Form inputs */}
            <Form
              name="login_form"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="space-y-4"
            >
              <Form.Item
                name="email"
                label={<span className="text-slate-800 font-bold text-xs uppercase tracking-wider">E-mail</span>}
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
                className="mb-3"
              >
                <Input
                  placeholder="Enter e-mail"
                  className="py-2.5 rounded-xl border-slate-200 hover:border-primary focus:border-primary text-sm font-semibold"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="text-slate-800 font-bold text-xs uppercase tracking-wider">Password</span>}
                rules={[{ required: true, message: "Please input your password!" }]}
                className="mb-2"
              >
                <Input.Password
                  placeholder="Enter password"
                  className="py-2.5 rounded-xl border-slate-200 hover:border-primary focus:border-primary text-sm font-semibold"
                  size="large"
                />
              </Form.Item>

              <div className="flex items-center justify-between pt-1">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-slate-650 font-bold text-xs">
                    Remember Me
                  </Checkbox>
                </Form.Item>
                <Link
                  href="/forgot-password"
                  className="text-xs font-extrabold text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Form.Item className="mb-0 pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  className="w-full !bg-[#2b59c3] hover:!bg-[#1e44a5] !border-none !text-white h-11 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all hover:scale-[1.01]"
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            {/* Footer Text */}
            <div className="text-center pt-4 text-sm text-slate-500 font-semibold">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#2563eb] hover:text-[#1d4ed8] font-bold transition-colors">
                Sign up
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
