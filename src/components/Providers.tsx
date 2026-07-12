"use client";

import { SessionProvider } from "next-auth/react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { theme } from "@/app/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const cssVariables = `
    :root {
      --color-primary: ${theme.colors.primary};
      --color-primary-hover: ${theme.colors.primaryHover};
      --color-primary-light: ${theme.colors.primaryLight};
      --color-primary-active: ${theme.colors.primaryActive};
      --color-app-bg: ${theme.colors.appBg};
      --color-sidebar-bg: ${theme.colors.sidebarBg};
      
      --color-gray-950: ${theme.colors.gray950};
      --color-gray-900: ${theme.colors.gray900};
      --color-gray-800: ${theme.colors.gray800};
      --color-gray-700: ${theme.colors.gray700};
      --color-gray-600: ${theme.colors.gray600};
      --color-gray-500: ${theme.colors.gray500};
      --color-gray-400: ${theme.colors.gray400};
      --color-gray-300: ${theme.colors.gray300};
      --color-gray-200: ${theme.colors.gray200};
      --color-gray-100: ${theme.colors.gray100};
      --color-gray-50: ${theme.colors.gray50};
      
      --radius-custom-lg: ${theme.borderRadius.lg};
      --radius-custom-xl: ${theme.borderRadius.xl};
      --radius-custom-2xl: ${theme.borderRadius.xxl};
      
      --background: #ffffff;
      --foreground: #171717;
    }
    
    body {
      background: var(--color-gray-950);
      color: var(--color-gray-100);
    }
  `;

  return (
    <SessionProvider>
      <AntdRegistry>
        <ConfigProvider theme={{
          token: {
            colorPrimary: theme.colors.primary,
            borderRadius: parseInt(theme.borderRadius.lg),
          }
        }}>
          <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
          {children}
        </ConfigProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}
