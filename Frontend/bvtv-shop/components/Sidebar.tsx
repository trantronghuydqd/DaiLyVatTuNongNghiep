"use client";

import {
    User,
    Package,
    LogOut,
    LayoutDashboard,
    ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";

interface SidebarProps {
    activeTab: "orders" | "profile";
    setActiveTab: (tab: "orders" | "profile") => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const { user, logout } = useAuthStore();

    if (!user) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden sticky top-24">
            {/* User Profile Summary */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-1 shadow-lg mb-4">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <span className="text-3xl font-bold text-emerald-600">
                                {user.sortName?.charAt(0) ||
                                    user.name?.charAt(0)}
                            </span>
                        </div>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        {user.role === "ADMIN"
                            ? "Quản trị viên"
                            : user.role === "STAFF"
                            ? "Nhân viên"
                            : "Khách hàng thân thiết"}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-4 space-y-2">
                <button
                    onClick={() => setActiveTab("orders")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        activeTab === "orders"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                            : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                >
                    <Package className="w-5 h-5" />
                    Đơn hàng của tôi
                </button>

                <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        activeTab === "profile"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                            : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                >
                    <User className="w-5 h-5" />
                    Thông tin tài khoản
                </button>

                {(user.role === "ADMIN" || user.role === "STAFF") && (
                    <Link
                        href="/dashboard/admin"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 font-medium"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Trang quản trị
                    </Link>
                )}

                <div className="pt-4 mt-4 border-t border-gray-100">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
