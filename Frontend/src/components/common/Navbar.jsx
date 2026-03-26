import React from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Dropdown, Badge } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "./Logo";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Profile" },
    { key: "settings", icon: <SettingOutlined />, label: "Settings" },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <span className="text-danger">Logout</span>,
      onClick: () => {
        logout();
        navigate("/");
      },
    },
  ];

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b border-bg-border"
      style={{ background: "rgba(7,7,14,0.92)", backdropFilter: "blur(12px)" }}
    >
      <Logo size="sm" />

      <div className="flex items-center gap-4">
        <div
          className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full border border-bg-border"
          style={{ background: "#0d0d18" }}
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
          <span className="text-xs text-txt-secondary font-medium ml-1">
            {user?.role === "teacher" ? "Teacher" : "Student"}
          </span>
        </div>

        <Badge count={3} size="small" color="#7c3aed">
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-txt-secondary hover:text-txt-primary hover:bg-bg-hover transition-all"
            style={{ border: "1px solid #1e1e35", background: "#0d0d18" }}
          >
            <BellOutlined style={{ fontSize: 16 }} />
          </button>
        </Badge>

        <Dropdown
          menu={{ items: menuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <button className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-bg-hover transition-all">
            <Avatar
              size={32}
              style={{
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {initials}
            </Avatar>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-txt-primary leading-tight">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-txt-secondary leading-tight">
                {user?.email || ""}
              </div>
            </div>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
