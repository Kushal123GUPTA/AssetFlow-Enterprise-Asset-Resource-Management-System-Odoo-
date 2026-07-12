"use client";

import { Form, Input, Button, Alert } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { requestPasswordReset, isLoading, error, clearError } = useAuthStore();
  const [message, setMessage] = useState<string | null>(null);
  const [resetPath, setResetPath] = useState<string | null>(null);

  const onFinish = async (values: { email: string }) => {
    clearError();
    setMessage(null);
    setResetPath(null);
    const result = await requestPasswordReset(values.email);
    if (!result.ok) return;
    setMessage(result.message ?? "If an account exists, continue to reset your password.");
    if (result.resetPath) setResetPath(result.resetPath);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert message={error} type="error" showIcon closable onClose={clearError} />
      )}
      {message && (
        <Alert
          message={message}
          type="success"
          showIcon
          description={
            resetPath ? (
              <Button type="primary" className="mt-2" onClick={() => router.push(resetPath)}>
                Continue to reset password
              </Button>
            ) : null
          }
        />
      )}
      {!resetPath && (
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Continue
          </Button>
        </Form>
      )}
    </div>
  );
}
