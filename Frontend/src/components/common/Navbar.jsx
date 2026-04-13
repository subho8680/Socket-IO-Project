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

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <span className="text-red-600">Logout</span>,
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-2xl leading-none tracking-tighter">
                Q
              </span>
            </div>
            <div>
              <span className="font-semibold text-2xl tracking-tighter text-gray-900">
                Quizly
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full border border-gray-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-gray-600 tracking-wide">
              {user?.role === "teacher" ? "Teacher Mode" : "Student Mode"}
            </span>
          </div>

          <Badge count={3} size="small" color="#6366f1" offset={[2, 2]}>
            <button className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-all text-gray-600 hover:text-gray-900">
              <BellOutlined style={{ fontSize: 19 }} />
            </button>
          </Badge>

          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <button className="flex items-center gap-3 px-2 py-1.5 rounded-2xl hover:bg-gray-100 transition-all group">
              <Avatar
                size={38}
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
                }}
              >
                {initials}
              </Avatar>

              <div className="hidden md:block text-left">
                <div className="font-semibold text-gray-900 text-[15px] leading-tight group-hover:text-violet-700 transition-colors">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500">{user?.email || ""}</div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
