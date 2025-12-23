"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    SupplierReturn,
    SupplierReturnItem,
    DocumentStatus,
    ProductUnit,
    Warehouse,
    Profile,
    GoodsReceipt,
} from "@/types";
import {
    PackageX,
    Plus,
    Edit,
    Trash2,
    Check,
    X,
    XCircle,
    Eye,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export default function SupplierReturnsPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "ADMIN";

    const [returns, setReturns] = useState<SupplierReturn[]>([]);
    const [products, setProducts] = useState<ProductUnit[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers] = useState<Profile[]>([]);
    const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
    const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingReturn, setEditingReturn] = useState<SupplierReturn | null>(
        null
    );
    const [viewingReturn, setViewingReturn] = useState<SupplierReturn | null>(
        null
    );
    const [formData, setFormData] = useState<Partial<SupplierReturn>>({
        warehouse: undefined,
        supplier: undefined,
        status: DocumentStatus.DRAFT,
        reason: "",
        items: [],
        totalVat: 0,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [returnsRes, productsRes, warehousesRes, suppliersRes] =
                await Promise.all([
                    api.get("/supplier-returns"),
                    api.get("/product-units"),
                    api.get("/warehouses"),
                    api.get("/profiles"),
                ]);
            setReturns(returnsRes.data);
            setProducts(productsRes.data);
            setWarehouses(warehousesRes.data);
            setSuppliers(
                suppliersRes.data.filter((p: Profile) => p.role === "SUPPLIER")
            );
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingReturn(null);
        setFormData({
            warehouse: undefined,
            supplier: undefined,
            status: DocumentStatus.DRAFT,
            reason: "",
            items: [],
            totalVat: 0,
        });
        setReceipts([]);
        setSelectedReceiptId(null);
        setShowModal(true);
    };

    const openEditModal = (returnDoc: SupplierReturn) => {
        setEditingReturn(returnDoc);
        setFormData(returnDoc);
        setShowModal(true);
    };

    const openDetailModal = (returnDoc: SupplierReturn) => {
        setViewingReturn(returnDoc);
        setShowDetailModal(true);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...(formData.items || []),
                {
                    productUnit: products[0],
                    quantity: 1,
                    returnAmount: 0,
                },
            ],
        });
    };

    const updateItem = (
        index: number,
        field: keyof SupplierReturnItem,
        value: unknown
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
            if (editingReturn) {
                await api.put(
                    `/supplier-returns/${editingReturn.id}`,
                    formData
                );
                alert("Cập nhật phiếu trả hàng thành công!");
            } else {
                await api.post("/supplier-returns", formData);
                alert("Tạo phiếu trả hàng thành công!");
            }
            setShowModal(false);
            fetchData();
        } catch (error: unknown) {
            console.error("Error:", error);
            alert(
                (error as { response?: { data?: { message?: string } } })
                    .response?.data?.message || "Có lỗi xảy ra!"
            );
        }
    };

    const handleApprove = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền duyệt phiếu");
            return;
        }

        if (!confirm("Xác nhận duyệt phiếu trả hàng này?")) return;
        try {
            await api.post(`/supplier-returns/${id}/approve`);
            alert("Đã duyệt phiếu trả hàng!");
            fetchData();
        } catch (error: unknown) {
            console.error("Error:", error);
            alert(
                (error as { response?: { data?: { message?: string } } })
                    .response?.data?.message || "Có lỗi xảy ra!"
            );
        }
    };

    const handleReject = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền từ chối phiếu");
            return;
        }

        const reason = prompt("Nhập lý do từ chối:");
        if (!reason) return;
        try {
            await api.post(`/supplier-returns/${id}/reject`, { reason });
            alert("Đã từ chối phiếu trả hàng!");
            fetchData();
        } catch (error: unknown) {
            console.error("Error:", error);
            alert(
                (error as { response?: { data?: { message?: string } } })
                    .response?.data?.message || "Có lỗi xảy ra!"
            );
        }
    };

    const handleCancel = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền hủy phiếu");
            return;
        }

        if (!confirm("Xác nhận hủy phiếu trả hàng này?")) return;
        try {
            await api.post(`/supplier-returns/${id}/cancel`);
            alert("Đã hủy phiếu trả hàng!");
            fetchData();
        } catch (error: unknown) {
            console.error("Error:", error);
            alert(
                (error as { response?: { data?: { message?: string } } })
                    .response?.data?.message || "Có lỗi xảy ra!"
            );
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
                        <PackageX className="w-8 h-8 text-orange-600" />
                        Phiếu Trả Hàng NCC (PTHNCC)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Quản lý phiếu trả hàng cho nhà cung cấp
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Tạo phiếu mới
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                Số phiếu
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                Kho
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                NCC
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                Ngày trả
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                Tổng tiền
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {returns.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Chưa có phiếu nào
                                </td>
                            </tr>
                        ) : (
                            returns.map((ret) => (
                                <tr key={ret.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                        {ret.returnNo}
                                    </td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                                        {ret.warehouse?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                                        {ret.supplier?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                                        {new Date(
                                            ret.createdAt
                                        ).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                ret.status
                                            )}`}
                                        >
                                            {getStatusLabel(ret.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    (ret.totalReturn || 0) +
                                                        (ret.totalVat || 0)
                                                )}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                (Hàng:{" "}
                                                {formatCurrency(
                                                    ret.totalReturn || 0
                                                )}{" "}
                                                + VAT:{" "}
                                                {formatCurrency(
                                                    ret.totalVat || 0
                                                )}
                                                )
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() =>
                                                    openDetailModal(ret)
                                                }
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {ret.status ===
                                                DocumentStatus.PENDING &&
                                                isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleApprove(
                                                                    ret.id
                                                                )
                                                            }
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Duyệt"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleReject(
                                                                    ret.id
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Từ chối"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            {(ret.status ===
                                                DocumentStatus.DRAFT ||
                                                ret.status ===
                                                    DocumentStatus.PENDING) && (
                                                <button
                                                    onClick={() =>
                                                        openEditModal(ret)
                                                    }
                                                    className="text-orange-600 hover:text-orange-800"
                                                    title="Sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(ret.status ===
                                                DocumentStatus.APPROVED ||
                                                ret.status ===
                                                    DocumentStatus.PENDING) &&
                                                isAdmin && (
                                                    <button
                                                        onClick={() =>
                                                            handleCancel(ret.id)
                                                        }
                                                        className="text-yellow-600 hover:text-yellow-800"
                                                        title="Hủy"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            {ret.status !==
                                                DocumentStatus.APPROVED &&
                                                isAdmin && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(ret.id)
                                                        }
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">
                                {editingReturn
                                    ? "Sửa phiếu trả hàng"
                                    : "Tạo phiếu trả hàng mới"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kho *
                                        </label>
                                        <select
                                            value={formData.warehouse?.id || ""}
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
                                            <option value="">
                                                -- Chọn kho --
                                            </option>
                                            {warehouses.map((wh) => (
                                                <option
                                                    key={wh.id}
                                                    value={wh.id}
                                                >
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
                                            value={formData.supplier?.id || ""}
                                            onChange={async (e) => {
                                                const supplierId =
                                                    e.target.value;
                                                const sup = suppliers.find(
                                                    (s) =>
                                                        String(s.id) ===
                                                        String(supplierId)
                                                );
                                                setFormData({
                                                    ...formData,
                                                    supplier: sup,
                                                });

                                                if (supplierId) {
                                                    try {
                                                        const response =
                                                            await api.get(
                                                                "/goods-receipts"
                                                            );
                                                        const filteredReceipts =
                                                            response.data.filter(
                                                                (
                                                                    r: GoodsReceipt
                                                                ) =>
                                                                    String(
                                                                        r
                                                                            .supplier
                                                                            ?.id
                                                                    ) ===
                                                                    String(
                                                                        supplierId
                                                                    )
                                                            );
                                                        setReceipts(
                                                            filteredReceipts
                                                        );
                                                        setSelectedReceiptId(
                                                            null
                                                        );
                                                    } catch (error) {
                                                        console.error(
                                                            "Error fetching receipts:",
                                                            error
                                                        );
                                                        setReceipts([]);
                                                    }
                                                } else {
                                                    setReceipts([]);
                                                    setSelectedReceiptId(null);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">
                                                -- Chọn nhà cung cấp --
                                            </option>
                                            {suppliers.map((sup) => (
                                                <option
                                                    key={sup.id}
                                                    value={sup.id}
                                                >
                                                    {sup.name}{" "}
                                                    {sup.phone &&
                                                        `- ${sup.phone}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Receipt Selection */}
                                {receipts.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Chọn từ phiếu nhập (tùy chọn)
                                        </label>
                                        <select
                                            value={selectedReceiptId || ""}
                                            onChange={(e) => {
                                                const receiptId = e.target.value
                                                    ? parseInt(e.target.value)
                                                    : null;
                                                setSelectedReceiptId(receiptId);

                                                if (receiptId) {
                                                    const receipt =
                                                        receipts.find(
                                                            (r) =>
                                                                r.id ===
                                                                receiptId
                                                        );
                                                    if (
                                                        receipt &&
                                                        receipt.items &&
                                                        receipt.id
                                                    ) {
                                                        const returnItems: SupplierReturnItem[] =
                                                            receipt.items
                                                                .filter(
                                                                    (item) =>
                                                                        item.productUnit
                                                                )
                                                                .map(
                                                                    (item) => ({
                                                                        productUnit:
                                                                            item.productUnit!,
                                                                        quantity:
                                                                            item.quantity,
                                                                        returnAmount:
                                                                            item.unitCost *
                                                                            item.quantity,
                                                                    })
                                                                );
                                                        setFormData({
                                                            ...formData,
                                                            receipt: {
                                                                id: receipt.id,
                                                            },
                                                            items: returnItems,
                                                            totalVat:
                                                                receipt.totalVat ||
                                                                0,
                                                        });
                                                    }
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        receipt: undefined,
                                                        totalVat: 0,
                                                    });
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">
                                                -- Nhập thủ công --
                                            </option>
                                            {receipts.map((receipt) => (
                                                <option
                                                    key={receipt.id}
                                                    value={receipt.id}
                                                >
                                                    {receipt.receiptNo} -{" "}
                                                    {receipt.createdAt
                                                        ? new Date(
                                                              receipt.createdAt
                                                          ).toLocaleDateString()
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Chọn phiếu nhập để tự động điền sản
                                            phẩm
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lý do trả hàng
                                    </label>
                                    <textarea
                                        value={formData.reason}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                reason: e.target.value,
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
                                            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
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
                                                        item.productUnit?.id ||
                                                        ""
                                                    }
                                                    onChange={(e) => {
                                                        const prod =
                                                            products.find(
                                                                (p) =>
                                                                    p.id ===
                                                                    parseInt(
                                                                        e.target
                                                                            .value
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
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            "quantity",
                                                            parseInt(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    min="1"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Tiền trả"
                                                    value={item.returnAmount}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            "returnAmount",
                                                            parseFloat(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
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

                                {/* Total */}
                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Tổng tiền hàng trả:
                                        </span>
                                        <span className="font-semibold">
                                            {formatCurrency(
                                                formData.items?.reduce(
                                                    (sum, item) =>
                                                        sum +
                                                        (item.returnAmount ||
                                                            0),
                                                    0
                                                ) || 0
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Tiền thuế VAT hoàn:
                                        </span>
                                        <span className="font-semibold">
                                            {formatCurrency(
                                                formData.totalVat || 0
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Tổng tiền hoàn:</span>
                                        <span className="text-orange-600">
                                            {formatCurrency(
                                                (formData.items?.reduce(
                                                    (sum, item) =>
                                                        sum +
                                                        (item.returnAmount ||
                                                            0),
                                                    0
                                                ) || 0) +
                                                    (formData.totalVat || 0)
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                                    >
                                        {editingReturn ? "Cập nhật" : "Tạo mới"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && viewingReturn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">
                                        Chi tiết phiếu trả hàng
                                    </h2>
                                    <p className="text-gray-600">
                                        {viewingReturn.returnNo}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                                        viewingReturn.status
                                    )}`}
                                >
                                    {getStatusLabel(viewingReturn.status)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Nhà cung cấp
                                    </p>
                                    <p className="font-medium">
                                        {viewingReturn.supplier?.name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Kho</p>
                                    <p className="font-medium">
                                        {viewingReturn.warehouse?.name}
                                    </p>
                                </div>
                                {viewingReturn.receipt && (
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Phiếu nhập
                                        </p>
                                        <p className="font-medium">
                                            {viewingReturn.receipt.receiptNo}
                                        </p>
                                    </div>
                                )}
                                {viewingReturn.createdBy && (
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Người tạo
                                        </p>
                                        <p className="font-medium">
                                            {viewingReturn.createdBy.name}
                                        </p>
                                    </div>
                                )}
                                {viewingReturn.approvedBy && (
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Người duyệt
                                        </p>
                                        <p className="font-medium">
                                            {viewingReturn.approvedBy.name}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Ngày tạo
                                    </p>
                                    <p className="font-medium">
                                        {new Date(
                                            viewingReturn.createdAt
                                        ).toLocaleString("vi-VN")}
                                    </p>
                                </div>
                            </div>

                            {viewingReturn.reason && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        Lý do trả hàng
                                    </p>
                                    <p className="font-medium">
                                        {viewingReturn.reason}
                                    </p>
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="font-medium mb-2">
                                    Danh sách sản phẩm
                                </h3>
                                <table className="min-w-full border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm">
                                                Sản phẩm
                                            </th>
                                            <th className="px-4 py-2 text-right text-sm">
                                                Số lượng
                                            </th>
                                            <th className="px-4 py-2 text-right text-sm">
                                                Tiền trả
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingReturn.items?.map(
                                            (item, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="border-t"
                                                >
                                                    <td className="px-4 py-2 text-sm">
                                                        {item.productUnit?.name}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm">
                                                        {formatCurrency(
                                                            item.returnAmount
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t pt-4 mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Tổng tiền hàng trả:
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(
                                            viewingReturn.totalReturn || 0
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Tiền thuế VAT hoàn:
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(
                                            viewingReturn.totalVat || 0
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Tổng tiền hoàn:</span>
                                    <span className="text-orange-600">
                                        {formatCurrency(
                                            (viewingReturn.totalReturn || 0) +
                                                (viewingReturn.totalVat || 0)
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
