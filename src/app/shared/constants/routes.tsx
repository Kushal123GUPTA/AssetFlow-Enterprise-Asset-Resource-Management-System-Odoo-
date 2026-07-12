import {
  DashboardOutlined,
  BankOutlined,
  AppstoreOutlined,
  SwapOutlined,
  CalendarOutlined,
  ToolOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  BellOutlined
} from "@ant-design/icons";

export interface RouteItem {
  key: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  group: 'GENERAL' | 'UTILITIES' | 'SUPPORT & REPORTING';
}

export const SIDEBAR_ROUTES: RouteItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardOutlined />,
    group: "GENERAL"
  },
  {
    key: "organization-setup",
    label: "Organization setup",
    path: "/organization-setup",
    icon: <BankOutlined />,
    group: "GENERAL"
  },
  {
    key: "assets",
    label: "Assets",
    path: "/assets",
    icon: <AppstoreOutlined />,
    group: "GENERAL"
  },
  {
    key: "allocation-transfer",
    label: "Allocation & Transfer",
    path: "/allocation-transfer",
    icon: <SwapOutlined />,
    group: "UTILITIES"
  },
  {
    key: "resource-booking",
    label: "Resource Booking",
    path: "/resource-booking",
    icon: <CalendarOutlined />,
    group: "UTILITIES"
  },
  {
    key: "maintenance",
    label: "Maintenance",
    path: "/maintenance",
    icon: <ToolOutlined />,
    group: "UTILITIES"
  },
  {
    key: "audit",
    label: "Audit",
    path: "/audit",
    icon: <FileSearchOutlined />,
    group: "UTILITIES"
  },
  {
    key: "reports",
    label: "Reports",
    path: "/reports",
    icon: <BarChartOutlined />,
    group: "SUPPORT & REPORTING"
  },
  {
    key: "notifications",
    label: "Notifications",
    path: "/notifications",
    icon: <BellOutlined />,
    group: "SUPPORT & REPORTING"
  }
];
