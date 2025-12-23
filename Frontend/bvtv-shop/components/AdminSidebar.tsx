"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
    Package,
    Folder,
    Ticket,
    MapPin,
    Users,
    ShoppingCart,
    ArrowLeftRight,
    LogOut,
    LayoutDashboard,
    PackageCheck,
    PackageX,
} from "lucide-react";

const menuItems = [
    {
        label: "Tổng quan",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
        adminOnly: true, // Chỉ ADMIN
    },
    {
        label: "Sản phẩm",
        href: "/dashboard/admin/product-units",
        icon: Package,
        adminOnly: true, // Chỉ ADMIN
    },
    {
        label: "Danh mục",
        href: "/dashboard/admin/categories",
        icon: Folder,
        adminOnly: true, // Chỉ ADMIN
    },
    {
        label: "Mã giảm giá",
        href: "/dashboard/admin/coupons",
        icon: Ticket,
        adminOnly: true, // Chỉ ADMIN
    },
    {
        label: "Khu vực",
        href: "/dashboard/admin/areas",
        icon: MapPin,
        adminOnly: false, // STAFF + ADMIN
    },
    {
        label: "Khách hàng",
        href: "/dashboard/admin/profiles",
        icon: Users,
        adminOnly: false, // STAFF + ADMIN
    },
    {
        label: "Đơn hàng",
        href: "/dashboard/admin/orders",
        icon: ShoppingCart,
        adminOnly: false, // STAFF + ADMIN
    },
    {
        label: "Nhập xuất kho",
        href: "/dashboard/admin/inventory-movements",
        icon: ArrowLeftRight,
        adminOnly: false, // STAFF + ADMIN
    },
    {
        label: "Phiếu nhập hàng",
        href: "/dashboard/admin/goods-receipts",
        icon: PackageCheck,
        adminOnly: false, // STAFF + ADMIN
    },
    {
        label: "Phiếu trả hàng",
        href: "/dashboard/admin/customer-returns",
        icon: PackageX,
        adminOnly: false, // STAFF + ADMIN
    },
    {
        label: "Phiếu trả NCC",
        href: "/dashboard/admin/supplier-returns",
        icon: PackageX,
        adminOnly: false, // STAFF + ADMIN
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    if (!user) return null;

    const isAdmin = user.role === "ADMIN";
    const filteredMenuItems = menuItems.filter(
        (item) => !item.adminOnly || isAdmin
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden sticky top-24">
            {/* User Profile Summary */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-1 shadow-lg mb-3">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <span className="text-2xl font-bold text-emerald-600">
                                {user.sortName?.charAt(0) ||
                                    user.name?.charAt(0)}
                            </span>
                        </div>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base mb-1">
                        {user.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {user.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-3 space-y-1">
                {filteredMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                                isActive
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                    : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="pt-3 mt-3 border-t border-gray-100">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-medium text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
