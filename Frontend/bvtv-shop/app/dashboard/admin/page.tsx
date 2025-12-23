"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Package,
    ShoppingCart,
    Users,
    TrendingUp,
    AlertCircle,
} from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Nếu là STAFF, redirect sang trang khách hàng
        if (user?.role === "STAFF") {
            router.push("/dashboard/admin/profiles");
            return;
        }
        fetchStats();
    }, [user, router]);

    const fetchStats = async () => {
        try {
            const response = await api.get("/statistics/summary");
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch statistics:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                Tổng quan hệ thống
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Revenue Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            +12.5%
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Tổng doanh thu</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats ? formatCurrency(stats.totalRevenue) : "--"}
                    </h3>
                </div>

                {/* Orders Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                            {stats?.pendingOrders} chờ xử lý
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Tổng đơn hàng</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats?.totalOrders || 0}
                    </h3>
                </div>

                {/* Products Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Package className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Sản phẩm</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats?.totalProducts || 0}
                    </h3>
                </div>

                {/* Customers Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <Users className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Khách hàng</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats?.totalCustomers || 0}
                    </h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">
                        Biểu đồ doanh thu (7 ngày qua)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.revenueChart || []}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) =>
                                        formatCurrency(value as number)
                                    }
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="#059669"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">
                        Trạng thái đơn hàng
                    </h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.orderStatusDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.orderStatusDistribution?.map(
                                        (entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        )
                                    )}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Top Products & Quick Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Selling Products */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">
                        Sản phẩm bán chạy
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-3">Tên sản phẩm</th>
                                    <th className="pb-3 text-right">Đã bán</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats?.topSellingProducts?.map(
                                    (product: any, index: number) => (
                                        <tr key={index}>
                                            <td className="py-3 text-sm text-gray-900 font-medium">
                                                {product.name}
                                            </td>
                                            <td className="py-3 text-sm text-gray-600 text-right">
                                                {product.sold}
                                            </td>
                                        </tr>
                                    )
                                )}
                                {!stats?.topSellingProducts?.length && (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="py-4 text-center text-sm text-gray-500"
                                        >
                                            Chưa có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">
                        Hướng dẫn nhanh
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg mt-0.5">
                                <Package className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    Quản lý sản phẩm
                                </p>
                                <p className="text-sm text-gray-500">
                                    Thêm, sửa, xóa và cập nhật giá sản phẩm
                                </p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    Xử lý đơn hàng
                                </p>
                                <p className="text-sm text-gray-500">
                                    Xác nhận đơn hàng và cập nhật trạng thái
                                    giao hàng
                                </p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg mt-0.5">
                                <Users className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    Quản lý khách hàng
                                </p>
                                <p className="text-sm text-gray-500">
                                    Xem thông tin và lịch sử mua hàng của khách
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
