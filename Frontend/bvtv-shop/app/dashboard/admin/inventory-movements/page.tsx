"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    InventoryMovement,
    InventoryMovementType,
    ProductUnit,
    Warehouse,
} from "@/types";
import { useAuthStore } from "@/store/auth-store";

export default function InventoryMovementsPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "ADMIN";

    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [products, setProducts] = useState<ProductUnit[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMovement, setEditingMovement] =
        useState<InventoryMovement | null>(null);
    const [formData, setFormData] = useState({
        productUnitId: "",
        warehouseId: "",
        type: "PURCHASE" as InventoryMovementType,
        quantity: "",
        refTable: "",
        refId: "",
    });

    useEffect(() => {
        fetchMovements();
        fetchProducts();
        fetchWarehouses();
    }, []);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const response = await api.get("/inventory-movements");
            setMovements(response.data);
        } catch (error) {
            console.error("Lỗi khi tải phiếu kho:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get("/product-units");
            setProducts(response.data);
        } catch (error) {
            console.error("Lỗi khi tải sản phẩm:", error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const response = await api.get("/warehouses");
            setWarehouses(response.data);
        } catch (error) {
            console.error("Lỗi khi tải kho:", error);
        }
    };

    const openCreateModal = () => {
        setEditingMovement(null);
        setFormData({
            productUnitId: "",
            warehouseId: "",
            type: InventoryMovementType.PURCHASE,
            quantity: "",
            refTable: "",
            refId: "",
        });
        setShowModal(true);
    };

    const openEditModal = (movement: InventoryMovement) => {
        setEditingMovement(movement);
        setFormData({
            productUnitId: movement.productUnit.id.toString(),
            warehouseId: movement.warehouse.id.toString(),
            type: movement.type,
            quantity: movement.quantity.toString(),
            refTable: movement.refTable || "",
            refId: movement.refId?.toString() || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            productUnit: { id: parseInt(formData.productUnitId) },
            warehouse: { id: parseInt(formData.warehouseId) },
            type: formData.type,
            quantity: parseInt(formData.quantity),
            refTable: formData.refTable || null,
            refId: formData.refId ? parseInt(formData.refId) : null,
        };

        try {
            if (editingMovement) {
                await api.put(
                    `/inventory-movements/${editingMovement.id}`,
                    payload
                );
                alert("Cập nhật phiếu kho thành công!");
            } else {
                await api.post("/inventory-movements", payload);
                alert("Tạo phiếu kho thành công!");
            }
            setShowModal(false);
            fetchMovements();
        } catch (error: any) {
            console.error("Lỗi:", error);
            alert(
                error.response?.data?.message ||
                    "Có lỗi xảy ra. Vui lòng thử lại!"
            );
        }
    };

    const handleDelete = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền xóa phiếu kho");
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn xóa phiếu kho này?")) return;

        try {
            await api.delete(`/inventory-movements/${id}`);
            alert("Xóa phiếu kho thành công!");
            fetchMovements();
        } catch (error: any) {
            console.error("Lỗi:", error);
            alert(
                error.response?.data?.message ||
                    "Có lỗi xảy ra. Vui lòng thử lại!"
            );
        }
    };

    const getTypeColor = (type: InventoryMovementType) => {
        switch (type) {
            case InventoryMovementType.PURCHASE:
            case InventoryMovementType.RETURN_IN:
            case InventoryMovementType.TRANSFER_IN:
            case InventoryMovementType.CONVERSION_IN:
            case InventoryMovementType.ADJUSTMENT_POS:
                return "bg-green-100 text-green-800";
            case InventoryMovementType.SALE:
            case InventoryMovementType.RETURN_OUT:
            case InventoryMovementType.TRANSFER_OUT:
            case InventoryMovementType.CONVERSION_OUT:
            case InventoryMovementType.ADJUSTMENT_NEG:
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getTypeLabel = (type: InventoryMovementType) => {
        switch (type) {
            case InventoryMovementType.PURCHASE:
                return "Nhập mua hàng";
            case InventoryMovementType.SALE:
                return "Xuất bán hàng";
            case InventoryMovementType.RETURN_IN:
                return "Nhập trả hàng";
            case InventoryMovementType.RETURN_OUT:
                return "Xuất trả hàng";
            case InventoryMovementType.ADJUSTMENT_POS:
                return "Điều chỉnh tăng";
            case InventoryMovementType.ADJUSTMENT_NEG:
                return "Điều chỉnh giảm";
            case InventoryMovementType.TRANSFER_IN:
                return "Chuyển kho vào";
            case InventoryMovementType.TRANSFER_OUT:
                return "Chuyển kho ra";
            case InventoryMovementType.CONVERSION_IN:
                return "Quy đổi vào";
            case InventoryMovementType.CONVERSION_OUT:
                return "Quy đổi ra";
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    Quản lý Nhập Xuất Kho
                </h1>
                <button
                    onClick={openCreateModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                    + Tạo phiếu mới
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sản phẩm
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kho
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Loại
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Số lượng
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tham chiếu
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thời gian
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {movements.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Chưa có phiếu kho nào
                                </td>
                            </tr>
                        ) : (
                            movements.map((movement) => (
                                <tr
                                    key={movement.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        #{movement.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {movement.productUnit.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            SKU: {movement.productUnit.sku}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {movement.warehouse.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(
                                                movement.type
                                            )}`}
                                        >
                                            {getTypeLabel(movement.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`text-sm font-semibold ${
                                                [
                                                    InventoryMovementType.PURCHASE,
                                                    InventoryMovementType.RETURN_IN,
                                                    InventoryMovementType.TRANSFER_IN,
                                                    InventoryMovementType.CONVERSION_IN,
                                                    InventoryMovementType.ADJUSTMENT_POS,
                                                ].includes(movement.type)
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {[
                                                InventoryMovementType.PURCHASE,
                                                InventoryMovementType.RETURN_IN,
                                                InventoryMovementType.TRANSFER_IN,
                                                InventoryMovementType.CONVERSION_IN,
                                                InventoryMovementType.ADJUSTMENT_POS,
                                            ].includes(movement.type) && "+"}
                                            {[
                                                InventoryMovementType.SALE,
                                                InventoryMovementType.RETURN_OUT,
                                                InventoryMovementType.TRANSFER_OUT,
                                                InventoryMovementType.CONVERSION_OUT,
                                                InventoryMovementType.ADJUSTMENT_NEG,
                                            ].includes(movement.type) && "-"}
                                            {movement.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {movement.refTable && movement.refId
                                            ? `${movement.refTable}#${movement.refId}`
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(
                                            movement.createdAt
                                        ).toLocaleString("vi-VN")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() =>
                                                openEditModal(movement)
                                            }
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Sửa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingMovement
                                ? "Sửa phiếu kho"
                                : "Tạo phiếu kho mới"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sản phẩm *
                                </label>
                                <select
                                    value={formData.productUnitId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            productUnitId: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">
                                        -- Chọn sản phẩm --
                                    </option>
                                    {products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.name} ({product.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kho *
                                </label>
                                <select
                                    value={formData.warehouseId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            warehouseId: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">-- Chọn kho --</option>
                                    {warehouses.map((warehouse) => (
                                        <option
                                            key={warehouse.id}
                                            value={warehouse.id}
                                        >
                                            {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            type: e.target
                                                .value as InventoryMovementType,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option
                                        value={InventoryMovementType.PURCHASE}
                                    >
                                        Nhập mua hàng
                                    </option>
                                    <option value={InventoryMovementType.SALE}>
                                        Xuất bán hàng
                                    </option>
                                    <option
                                        value={InventoryMovementType.RETURN_IN}
                                    >
                                        Nhập trả hàng
                                    </option>
                                    <option
                                        value={InventoryMovementType.RETURN_OUT}
                                    >
                                        Xuất trả hàng
                                    </option>
                                    <option
                                        value={
                                            InventoryMovementType.ADJUSTMENT_POS
                                        }
                                    >
                                        Điều chỉnh tăng
                                    </option>
                                    <option
                                        value={
                                            InventoryMovementType.ADJUSTMENT_NEG
                                        }
                                    >
                                        Điều chỉnh giảm
                                    </option>
                                    <option
                                        value={
                                            InventoryMovementType.TRANSFER_IN
                                        }
                                    >
                                        Chuyển kho vào
                                    </option>
                                    <option
                                        value={
                                            InventoryMovementType.TRANSFER_OUT
                                        }
                                    >
                                        Chuyển kho ra
                                    </option>
                                    <option
                                        value={
                                            InventoryMovementType.CONVERSION_IN
                                        }
                                    >
                                        Quy đổi vào
                                    </option>
                                    <option
                                        value={
                                            InventoryMovementType.CONVERSION_OUT
                                        }
                                    >
                                        Quy đổi ra
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số lượng *
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            quantity: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bảng tham chiếu
                                </label>
                                <input
                                    type="text"
                                    value={formData.refTable}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            refTable: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="VD: orders, goods_receipts"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ID tham chiếu
                                </label>
                                <input
                                    type="number"
                                    value={formData.refId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            refId: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="ID của đơn hàng hoặc phiếu nhập"
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold"
                                >
                                    {editingMovement ? "Cập nhật" : "Tạo mới"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-md font-semibold"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
