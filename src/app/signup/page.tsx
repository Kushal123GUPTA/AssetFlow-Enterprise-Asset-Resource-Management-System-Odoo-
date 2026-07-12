"use client";

import { Form, Input, Button, Alert } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            className="mb-4"
          />
        )}
        
        {success && (
          <Alert
            message="Account created successfully! Logging you in..."
            type="success"
            showIcon
            className="mb-4"
          />
        )}

        <Form
          name="signup_form"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="mt-8"
        >
          <Form.Item
            name="organizationName"
            label={<span className="text-gray-700 font-medium">Organization Name</span>}
            rules={[{ required: true, message: "Please input your organization name!" }]}
          >
            <Input
              prefix={<BankOutlined className="text-gray-400" />}
              placeholder="Acme Corp"
              className="py-2"
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={<span className="text-gray-700 font-medium">Full Name</span>}
            rules={[{ required: true, message: "Please input your full name!" }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="John Doe"
              className="py-2"
            />
          </Form.Item>

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
              placeholder="john@example.com"
              className="py-2"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-gray-700 font-medium">Password</span>}
            rules={[
              { required: true, message: "Please input your password!" },
              { min: 8, message: "Password must be at least 8 characters long!" }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Create a password"
              className="py-2"
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-6">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-semibold"
              loading={isLoading}
              block
            >
              Sign Up
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
