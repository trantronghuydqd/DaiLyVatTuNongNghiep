"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    GoodsReceipt,
    GoodsReceiptItem,
    DocumentStatus,
    PaymentStatus,
    ProductUnit,
    Warehouse,
    Profile,
} from "@/types";
import { FileText, Plus, Edit, Trash2, Check, X, Eye } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export default function GoodsReceiptsPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "ADMIN";

    const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
    const [products, setProducts] = useState<ProductUnit[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<GoodsReceipt | null>(
        null
    );
    const [viewingReceipt, setViewingReceipt] = useState<GoodsReceipt | null>(
        null
    );
    const [formData, setFormData] = useState<Partial<GoodsReceipt>>({
        warehouse: undefined,
        supplier: undefined,
        status: DocumentStatus.DRAFT,
        paymentStatus: PaymentStatus.UNPAID,
        notes: "",
        items: [],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [receiptsRes, productsRes, warehousesRes, suppliersRes] =
                await Promise.all([
                    api.get("/goods-receipts"),
                    api.get("/product-units"),
                    api.get("/warehouses"),
                    api.get("/profiles"),
                ]);
            setReceipts(receiptsRes.data);
            setProducts(productsRes.data);
            setWarehouses(warehousesRes.data);
            setSuppliers(
                suppliersRes.data.filter((p: Profile) => p.role === "SUPPLIER")
            );
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingReceipt(null);
        setFormData({
            warehouse: undefined,
            supplier: undefined,
            status: DocumentStatus.DRAFT,
            paymentStatus: PaymentStatus.UNPAID,
            notes: "",
            items: [],
        });
        setShowModal(true);
    };

    const openEditModal = (receipt: GoodsReceipt) => {
        setEditingReceipt(receipt);
        setFormData(receipt);
        setShowModal(true);
    };

    const openDetailModal = (receipt: GoodsReceipt) => {
        setViewingReceipt(receipt);
        setShowDetailModal(true);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...(formData.items || []),
                {
                    productUnit: undefined as any,
                    quantity: 1,
                    unitCost: 0,
                },
            ],
        });
    };

    const updateItem = (
        index: number,
        field: keyof GoodsReceiptItem,
        value: any
    ) => {
        const items = [...(formData.items || [])];
        items[index] = { ...items[index], [field]: value };
        setFormData({ ...formData, items });
    };

    const removeItem = (index: number) => {
        const items = [...(formData.items || [])];
        items.splice(index, 1);
        setFormData({ ...formData, items });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !formData.warehouse ||
            !formData.items ||
            formData.items.length === 0
        ) {
            alert("Vui lòng chọn kho và thêm ít nhất 1 sản phẩm!");
            return;
        }

        try {
            if (editingReceipt) {
                await api.put(`/goods-receipts/${editingReceipt.id}`, formData);
                alert("Cập nhật phiếu nhập hàng thành công!");
            } else {
                await api.post("/goods-receipts", formData);
                alert("Tạo phiếu nhập hàng thành công!");
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            console.error("Error:", error);
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    const handleConfirm = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền xác nhận phiếu");
            return;
        }

        if (!confirm("Xác nhận phiếu nhập hàng này?")) return;
        try {
            await api.post(`/goods-receipts/${id}/confirm`);
            alert("Xác nhận thành công!");
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    const handleCancel = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền hủy phiếu");
            return;
        }

        if (!confirm("Hủy phiếu nhập hàng này?")) return;
        try {
            await api.post(`/goods-receipts/${id}/cancel`);
            alert("Hủy phiếu thành công!");
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    const getStatusBadge = (status: DocumentStatus) => {
        const colors: Record<DocumentStatus, string> = {
            [DocumentStatus.DRAFT]: "bg-gray-100 text-gray-800",
            [DocumentStatus.PENDING]: "bg-yellow-100 text-yellow-800",
            [DocumentStatus.CONFIRMED]: "bg-blue-100 text-blue-800",
            [DocumentStatus.APPROVED]: "bg-green-100 text-green-800",
            [DocumentStatus.IN_TRANSIT]: "bg-purple-100 text-purple-800",
            [DocumentStatus.COMPLETED]: "bg-emerald-100 text-emerald-800",
            [DocumentStatus.REJECTED]: "bg-red-100 text-red-800",
            [DocumentStatus.CANCELLED]: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getStatusLabel = (status: DocumentStatus) => {
        const labels: Record<DocumentStatus, string> = {
            [DocumentStatus.DRAFT]: "Nháp",
            [DocumentStatus.PENDING]: "Chờ duyệt",
            [DocumentStatus.CONFIRMED]: "Đã xác nhận",
            [DocumentStatus.APPROVED]: "Đã duyệt",
            [DocumentStatus.IN_TRANSIT]: "Đang vận chuyển",
            [DocumentStatus.COMPLETED]: "Hoàn thành",
            [DocumentStatus.REJECTED]: "Từ chối",
            [DocumentStatus.CANCELLED]: "Đã hủy",
        };
        return labels[status] || status;
    };

    const getPaymentLabel = (status: PaymentStatus) => {
        const labels: Record<PaymentStatus, string> = {
            [PaymentStatus.UNPAID]: "Chưa thanh toán",
            [PaymentStatus.PARTIAL]: "Thanh toán một phần",
            [PaymentStatus.PAID]: "Đã thanh toán",
        };
        return labels[status] || status;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
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
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-8 h-8" />
                        Phiếu Nhập Hàng (PNH)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Quản lý phiếu nhập hàng từ nhà cung cấp
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Tạo phiếu mới
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Số phiếu
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Kho
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Nhà cung cấp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Ngày tạo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Thanh toán
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Tổng tiền
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {receipts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Chưa có phiếu nào
                                </td>
                            </tr>
                        ) : (
                            receipts.map((receipt) => (
                                <tr
                                    key={receipt.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {receipt.receiptNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {receipt.warehouse.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {receipt.supplier?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {receipt.createdAt
                                            ? new Date(
                                                  receipt.createdAt
                                              ).toLocaleDateString("vi-VN")
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                receipt.status
                                            )}`}
                                        >
                                            {getStatusLabel(receipt.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                receipt.paymentStatus ===
                                                PaymentStatus.PAID
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {getPaymentLabel(
                                                receipt.paymentStatus
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">
                                                {receipt.grandTotal
                                                    ? formatCurrency(
                                                          receipt.grandTotal
                                                      )
                                                    : formatCurrency(
                                                          (receipt.totalAmount ||
                                                              0) +
                                                              (receipt.totalVat ||
                                                                  0)
                                                      )}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                (Hàng:{" "}
                                                {formatCurrency(
                                                    receipt.totalAmount || 0
                                                )}{" "}
                                                + VAT:{" "}
                                                {formatCurrency(
                                                    receipt.totalVat || 0
                                                )}
                                                )
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() =>
                                                openDetailModal(receipt)
                                            }
                                            className="text-gray-600 hover:text-gray-900"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4 inline" />
                                        </button>
                                        {receipt.status ===
                                            DocumentStatus.DRAFT && (
                                            <>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() =>
                                                            handleConfirm(
                                                                receipt.id!
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Xác nhận"
                                                    >
                                                        <Check className="w-4 h-4 inline" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        openEditModal(receipt)
                                                    }
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Sửa"
                                                >
                                                    <Edit className="w-4 h-4 inline" />
                                                </button>
                                            </>
                                        )}
                                        {receipt.status !==
                                            DocumentStatus.CANCELLED &&
                                            isAdmin && (
                                                <button
                                                    onClick={() =>
                                                        handleCancel(
                                                            receipt.id!
                                                        )
                                                    }
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Hủy"
                                                >
                                                    <X className="w-4 h-4 inline" />
                                                </button>
                                            )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {showDetailModal && viewingReceipt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold">
                                Chi tiết phiếu nhập hàng
                            </h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Số phiếu
                                    </p>
                                    <p className="font-semibold">
                                        {viewingReceipt.receiptNo}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Trạng thái
                                    </p>
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                            viewingReceipt.status
                                        )}`}
                                    >
                                        {viewingReceipt.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Kho nhập
                                    </p>
                                    <p className="font-semibold">
                                        {viewingReceipt.warehouse.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Nhà cung cấp
                                    </p>
                                    <p className="font-semibold">
                                        {viewingReceipt.supplier?.name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Ngày tạo
                                    </p>
                                    <p className="font-semibold">
                                        {viewingReceipt.createdAt
                                            ? new Date(
                                                  viewingReceipt.createdAt
                                              ).toLocaleString("vi-VN")
                                            : "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Thanh toán
                                    </p>
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            viewingReceipt.paymentStatus ===
                                            PaymentStatus.PAID
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {viewingReceipt.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            {viewingReceipt.notes && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        Ghi chú
                                    </p>
                                    <p className="bg-gray-50 p-3 rounded">
                                        {viewingReceipt.notes}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-lg mb-2">
                                    Danh sách sản phẩm
                                </h3>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Sản phẩm
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Số lượng
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Đơn giá
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Thành tiền
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {viewingReceipt.items?.map(
                                            (item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm">
                                                        {item.productUnit
                                                            ?.name || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {formatCurrency(
                                                            item.unitCost || 0
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm font-semibold">
                                                        {formatCurrency(
                                                            (item.quantity ||
                                                                0) *
                                                                (item.unitCost ||
                                                                    0)
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-2 text-sm font-semibold text-right"
                                            >
                                                Tiền hàng:
                                            </td>
                                            <td className="px-4 py-2 text-sm font-semibold">
                                                {formatCurrency(
                                                    viewingReceipt.totalAmount ||
                                                        0
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-2 text-sm font-semibold text-right"
                                            >
                                                VAT:
                                            </td>
                                            <td className="px-4 py-2 text-sm font-semibold">
                                                {formatCurrency(
                                                    viewingReceipt.totalVat || 0
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-2 text-sm font-bold text-right"
                                            >
                                                Tổng cộng:
                                            </td>
                                            <td className="px-4 py-2 text-sm font-bold text-emerald-600">
                                                {formatCurrency(
                                                    viewingReceipt.grandTotal ||
                                                        (viewingReceipt.totalAmount ||
                                                            0) +
                                                            (viewingReceipt.totalVat ||
                                                                0)
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingReceipt
                                ? "Sửa phiếu nhập hàng"
                                : "Tạo phiếu nhập hàng mới"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kho *
                                    </label>
                                    <select
                                        value={
                                            formData.warehouse?.id?.toString() ||
                                            ""
                                        }
                                        onChange={(e) => {
                                            const wh = warehouses.find(
                                                (w) =>
                                                    w.id ===
                                                    parseInt(e.target.value)
                                            );
                                            setFormData({
                                                ...formData,
                                                warehouse: wh,
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">-- Chọn kho --</option>
                                        {warehouses.map((wh) => (
                                            <option key={wh.id} value={wh.id}>
                                                {wh.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nhà cung cấp
                                    </label>
                                    <select
                                        value={
                                            formData.supplier?.id?.toString() ||
                                            ""
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const sup = suppliers.find(
                                                (s) => s.id.toString() === value
                                            );
                                            setFormData({
                                                ...formData,
                                                supplier: sup,
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">-- Chọn NCC --</option>
                                        {suppliers.map((sup) => (
                                            <option key={sup.id} value={sup.id}>
                                                {sup.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trạng thái thanh toán
                                    </label>
                                    <select
                                        value={formData.paymentStatus}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                paymentStatus: e.target
                                                    .value as PaymentStatus,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value={PaymentStatus.UNPAID}>
                                            Chưa thanh toán
                                        </option>
                                        <option value={PaymentStatus.PARTIAL}>
                                            Thanh toán 1 phần
                                        </option>
                                        <option value={PaymentStatus.PAID}>
                                            Đã thanh toán
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghi chú
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            notes: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    rows={2}
                                />
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Danh sách sản phẩm *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                                    >
                                        + Thêm sản phẩm
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {formData.items?.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex gap-2 items-center bg-gray-50 p-2 rounded"
                                        >
                                            <select
                                                value={
                                                    item.productUnit?.id?.toString() ||
                                                    ""
                                                }
                                                onChange={(e) => {
                                                    const prod = products.find(
                                                        (p) =>
                                                            p.id ===
                                                            parseInt(
                                                                e.target.value
                                                            )
                                                    );
                                                    updateItem(
                                                        index,
                                                        "productUnit",
                                                        prod
                                                    );
                                                }}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                                required
                                            >
                                                <option value="">
                                                    -- Chọn SP --
                                                </option>
                                                {products.map((prod) => (
                                                    <option
                                                        key={prod.id}
                                                        value={prod.id}
                                                    >
                                                        {prod.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="SL"
                                                value={item.quantity || ""}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "quantity",
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                min="1"
                                                required
                                            />
                                            <input
                                                type="number"
                                                placeholder="Đơn giá"
                                                value={item.unitCost || ""}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "unitCost",
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                                min="0"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tổng tiền */}
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Tổng tiền hàng:
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(
                                            formData.items?.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    (item.quantity || 0) *
                                                        (item.unitCost || 0),
                                                0
                                            ) || 0
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Tiền thuế VAT:
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(
                                            formData.items?.reduce(
                                                (sum, item) => {
                                                    const lineTotal =
                                                        (item.quantity || 0) *
                                                        (item.unitCost || 0);
                                                    const product =
                                                        products.find(
                                                            (p) =>
                                                                p.id ===
                                                                item.productUnit
                                                                    ?.id
                                                        );
                                                    const vatRate =
                                                        product?.vatRate || 0;
                                                    return (
                                                        sum +
                                                        (lineTotal * vatRate) /
                                                            100
                                                    );
                                                },
                                                0
                                            ) || 0
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Tổng tiền:</span>
                                    <span className="text-emerald-600">
                                        {formatCurrency(
                                            formData.items?.reduce(
                                                (sum, item) => {
                                                    const lineTotal =
                                                        (item.quantity || 0) *
                                                        (item.unitCost || 0);
                                                    const product =
                                                        products.find(
                                                            (p) =>
                                                                p.id ===
                                                                item.productUnit
                                                                    ?.id
                                                        );
                                                    const vatRate =
                                                        product?.vatRate || 0;
                                                    const vatAmount =
                                                        (lineTotal * vatRate) /
                                                        100;
                                                    return (
                                                        sum +
                                                        lineTotal +
                                                        vatAmount
                                                    );
                                                },
                                                0
                                            ) || 0
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                >
                                    {editingReceipt ? "Cập nhật" : "Tạo mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
