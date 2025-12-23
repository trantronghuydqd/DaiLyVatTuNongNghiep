"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

interface Profile {
    id: string;
    email: string;
    name: string;
    sortName?: string;
    phone?: string;
    address?: string;
    role: "CUSTOMER" | "AGENT" | "SUPPLIER" | "STAFF" | "ADMIN";
    isActive: boolean;
    createdAt: string;
}

export default function ProfilesAdminPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "ADMIN";

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [showModal, setShowModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        sortName: "",
        phone: "",
        address: "",
        role: "CUSTOMER" as Profile["role"],
        isActive: true,
    });

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const response = await api.get("/profiles");
            setProfiles(response.data);
        } catch (error) {
            console.error("Lỗi khi tải người dùng:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload: any = {
                name: formData.name,
                sortName: formData.sortName,
                phone: formData.phone,
                address: formData.address,
                role: formData.role,
                isActive: formData.isActive,
            };

            if (editingProfile) {
                // Cập nhật người dùng hiện có
                await api.put(`/profiles/${editingProfile.id}`, payload);
            } else {
                // Thêm người dùng mới (cần email)
                payload.email = formData.email;
                await api.post("/profiles", payload);
            }

            setShowModal(false);
            resetForm();
            fetchProfiles();
        } catch (error) {
            console.error("Lỗi khi lưu người dùng:", error);
            alert("Có lỗi xảy ra khi lưu người dùng");
        }
    };

    const handleEdit = (profile: Profile) => {
        setEditingProfile(profile);
        setFormData({
            name: profile.name,
            sortName: profile.sortName || "",
            phone: profile.phone || "",
            address: profile.address || "",
            role: profile.role,
            isActive: profile.isActive ?? true,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền xóa người dùng");
            return;
        }

        if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

        try {
            await api.delete(`/profiles/${id}`);
            fetchProfiles();
        } catch (error) {
            console.error("Lỗi khi xóa người dùng:", error);
            alert("Có lỗi xảy ra khi xóa người dùng");
        }
    };

    const resetForm = () => {
        setFormData({
            email: "",
            name: "",
            sortName: "",
            phone: "",
            address: "",
            role: "CUSTOMER",
            isActive: true,
        });
        setEditingProfile(null);
    };

    const filteredProfiles = profiles.filter((profile) => {
        const matchSearch =
            profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            profile.phone?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchRole = filterRole === "ALL" || profile.role === filterRole;

        return matchSearch && matchRole;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "ADMIN":
                return "bg-red-100 text-red-700";
            case "STAFF":
                return "bg-purple-100 text-purple-700";
            case "AGENT":
                return "bg-blue-100 text-blue-700";
            case "SUPPLIER":
                return "bg-orange-100 text-orange-700";
            case "CUSTOMER":
                return "bg-green-100 text-green-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "ADMIN":
                return "Quản trị viên";
            case "STAFF":
                return "Nhân viên";
            case "AGENT":
                return "Đại lý";
            case "SUPPLIER":
                return "Nhà cung cấp";
            case "CUSTOMER":
                return "Khách hàng";
            default:
                return role;
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    Quản lý người dùng
                </h1>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    + Thêm người dùng
                </button>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, email, SĐT..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="ALL">Tất cả vai trò</option>
                        <option value="ADMIN">Quản trị viên</option>
                        <option value="STAFF">Nhân viên</option>
                        <option value="AGENT">Đại lý</option>
                        <option value="SUPPLIER">Nhà cung cấp</option>
                        <option value="CUSTOMER">Khách hàng</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        Đang tải...
                    </div>
                ) : filteredProfiles.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Không tìm thấy người dùng nào
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Tên người dùng
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        SĐT
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Vai trò
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProfiles.map((profile) => (
                                    <tr
                                        key={profile.id}
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800">
                                                {profile.name}
                                            </div>
                                            {profile.sortName && (
                                                <div className="text-sm text-gray-500">
                                                    {profile.sortName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {profile.email}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {profile.phone || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(
                                                    profile.role
                                                )}`}
                                            >
                                                {getRoleLabel(profile.role)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(profile)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Sửa
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                profile.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingProfile
                                ? "Sửa thông tin người dùng"
                                : "Thêm người dùng mới"}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            {editingProfile && (
                                <div className="mb-4 p-3 bg-gray-50 rounded">
                                    <div className="text-sm text-gray-600">
                                        Email:
                                    </div>
                                    <div className="font-medium">
                                        {editingProfile.email}
                                    </div>
                                </div>
                            )}

                            {!editingProfile && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Tên đầy đủ *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Tên rút gọn
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.sortName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sortName: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Vai trò *
                                    </label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                role: e.target
                                                    .value as Profile["role"],
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        disabled={!isAdmin}
                                    >
                                        <option value="CUSTOMER">
                                            Khách hàng
                                        </option>
                                        <option value="AGENT">Đại lý</option>
                                        <option value="SUPPLIER">
                                            Nhà cung cấp
                                        </option>
                                        <option value="STAFF">Nhân viên</option>
                                        {isAdmin && (
                                            <option value="ADMIN">
                                                Quản trị viên
                                            </option>
                                        )}
                                    </select>
                                    {!isAdmin && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Chỉ ADMIN mới được đổi vai trò
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Địa chỉ
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            address: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
