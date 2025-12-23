"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    CustomerReturn,
    CustomerReturnItem,
    DocumentStatus,
    ProductUnit,
    Warehouse,
    Profile,
    Order,
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

export default function CustomerReturnsPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "ADMIN";

    const [returns, setReturns] = useState<CustomerReturn[]>([]);
    const [products, setProducts] = useState<ProductUnit[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [customers, setCustomers] = useState<Profile[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingReturn, setEditingReturn] = useState<CustomerReturn | null>(
        null
    );
    const [viewingReturn, setViewingReturn] = useState<CustomerReturn | null>(
        null
    );
    const [formData, setFormData] = useState<Partial<CustomerReturn>>({
        warehouse: undefined,
        customer: undefined,
        status: DocumentStatus.DRAFT,
        reason: "",
        items: [],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [returnsRes, productsRes, warehousesRes, customersRes] =
                await Promise.all([
                    api.get("/customer-returns"),
                    api.get("/product-units"),
                    api.get("/warehouses"),
                    api.get("/profiles"),
                ]);
            setReturns(returnsRes.data);
            setProducts(productsRes.data);
            setWarehouses(warehousesRes.data);
            setCustomers(customersRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingReturn(null);
        setFormData({
            warehouse: undefined,
            customer: undefined,
            status: DocumentStatus.DRAFT,
            reason: "",
            items: [],
        });
        setOrders([]);
        setSelectedOrderId(null);
        setShowModal(true);
    };

    const openEditModal = (returnDoc: CustomerReturn) => {
        setEditingReturn(returnDoc);
        setFormData(returnDoc);
        setShowModal(true);
    };

    const openDetailModal = (returnDoc: CustomerReturn) => {
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
                    refundAmount: 0,
                },
            ],
        });
    };

    const updateItem = (
        index: number,
        field: keyof CustomerReturnItem,
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
            if (editingReturn) {
                await api.put(
                    `/customer-returns/${editingReturn.id}`,
                    formData
                );
                alert("Cập nhật phiếu trả hàng thành công!");
            } else {
                await api.post("/customer-returns", formData);
                alert("Tạo phiếu trả hàng thành công!");
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            console.error("Error:", error);
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    const handleApprove = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền duyệt phiếu");
            return;
        }

        if (!confirm("Phê duyệt phiếu trả hàng này?")) return;
        try {
            await api.post(`/customer-returns/${id}/approve`);
            alert("Phê duyệt thành công!");
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    const handleReject = async (id: number) => {
        if (!isAdmin) {
            alert("Chỉ ADMIN mới có quyền từ chối phiếu");
            return;
        }

        if (!confirm("Từ chối phiếu trả hàng này?")) return;
        try {
            await api.post(`/customer-returns/${id}/reject`);
            alert("Từ chối thành công!");
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

        if (!confirm("Hủy phiếu trả hàng này?")) return;
        try {
            await api.post(`/customer-returns/${id}/cancel`);
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
                        <PackageX className="w-8 h-8" />
                        Phiếu Trả Hàng (PTH)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Quản lý phiếu trả hàng từ khách hàng
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
                                Khách hàng
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Ngày trả
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trạng thái
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
                            returns.map((returnDoc) => (
                                <tr
                                    key={returnDoc.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {returnDoc.returnNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {returnDoc.warehouse.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {returnDoc.customer?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {returnDoc.createdAt
                                            ? new Date(
                                                  returnDoc.createdAt
                                              ).toLocaleDateString("vi-VN")
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                returnDoc.status
                                            )}`}
                                        >
                                            {getStatusLabel(returnDoc.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {returnDoc.totalRefund
                                            ? formatCurrency(
                                                  returnDoc.totalRefund
                                              )
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {returnDoc.status ===
                                            DocumentStatus.PENDING &&
                                            isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleApprove(
                                                                returnDoc.id!
                                                            )
                                                        }
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Phê duyệt"
                                                    >
                                                        <Check className="w-4 h-4 inline" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleReject(
                                                                returnDoc.id!
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Từ chối"
                                                    >
                                                        <XCircle className="w-4 h-4 inline" />
                                                    </button>
                                                </>
                                            )}
                                        <button
                                            onClick={() =>
                                                openDetailModal(returnDoc)
                                            }
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-4 h-4 inline" />
                                        </button>
                                        {returnDoc.status ===
                                            DocumentStatus.DRAFT && (
                                            <button
                                                onClick={() =>
                                                    openEditModal(returnDoc)
                                                }
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Sửa"
                                            >
                                                <Edit className="w-4 h-4 inline" />
                                            </button>
                                        )}
                                        {returnDoc.status !==
                                            DocumentStatus.CANCELLED &&
                                            isAdmin && (
                                                <button
                                                    onClick={() =>
                                                        handleCancel(
                                                            returnDoc.id!
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

            {/* Modal - Similar structure to GoodsReceipts */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
                        <h2 className="text-2xl font-bold mb-4">
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
                                        Khách hàng
                                    </label>
                                    <select
                                        value={formData.customer?.id || ""}
                                        onChange={async (e) => {
                                            const customerId = e.target.value;
                                            const cus = customers.find(
                                                (c) =>
                                                    String(c.id) ===
                                                    String(customerId)
                                            );
                                            setFormData({
                                                ...formData,
                                                customer: cus,
                                            });

                                            // Fetch orders for this customer
                                            if (customerId) {
                                                try {
                                                    const response =
                                                        await api.get(
                                                            `/orders/by-customer/${customerId}`
                                                        );
                                                    setOrders(response.data);
                                                    setSelectedOrderId(null);
                                                } catch (error) {
                                                    console.error(
                                                        "Error fetching orders:",
                                                        error
                                                    );
                                                    setOrders([]);
                                                }
                                            } else {
                                                setOrders([]);
                                                setSelectedOrderId(null);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">
                                            -- Chọn khách hàng --
                                        </option>
                                        {customers.map((cus) => (
                                            <option key={cus.id} value={cus.id}>
                                                {cus.name}{" "}
                                                {cus.phone && `- ${cus.phone}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Order Selection */}
                                {orders.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Chọn từ đơn hàng (tùy chọn)
                                        </label>
                                        <select
                                            value={selectedOrderId || ""}
                                            onChange={(e) => {
                                                const orderId = e.target.value
                                                    ? parseInt(e.target.value)
                                                    : null;
                                                setSelectedOrderId(orderId);

                                                if (orderId) {
                                                    const order = orders.find(
                                                        (o) => o.id === orderId
                                                    );
                                                    if (order && order.items) {
                                                        // Convert order items to return items
                                                        const returnItems: CustomerReturnItem[] =
                                                            order.items
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
                                                                        refundAmount:
                                                                            item.price *
                                                                            item.quantity,
                                                                    })
                                                                );
                                                        setFormData({
                                                            ...formData,
                                                            order: {
                                                                id: order.id,
                                                            },
                                                            items: returnItems,
                                                        });
                                                    }
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        order: undefined,
                                                    });
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">
                                                -- Nhập thủ công --
                                            </option>
                                            {orders.map((order) => (
                                                <option
                                                    key={order.id}
                                                    value={order.id}
                                                >
                                                    {order.orderNo} -{" "}
                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleDateString()}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Chọn đơn hàng để tự động điền sản
                                            phẩm
                                        </p>
                                    </div>
                                )}
                            </div>

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
                                                    item.productUnit?.id || ""
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
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "quantity",
                                                        parseInt(e.target.value)
                                                    )
                                                }
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                min="1"
                                                required
                                            />
                                            <input
                                                type="number"
                                                placeholder="Giá hoàn"
                                                value={item.refundAmount}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "refundAmount",
                                                        parseFloat(
                                                            e.target.value
                                                        )
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
                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Tổng tiền hoàn trả:</span>
                                    <span className="text-emerald-600">
                                        {formatCurrency(
                                            formData.items?.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    (item.quantity || 0) *
                                                        (item.refundAmount ||
                                                            0),
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
                                    {editingReturn ? "Cập nhật" : "Tạo mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && viewingReturn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">
                                    Chi tiết Phiếu Trả Hàng
                                </h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-semibold">
                                            Số phiếu:
                                        </label>
                                        <p>
                                            {viewingReturn.returnNo ||
                                                "Chưa có"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="font-semibold">
                                            Trạng thái:
                                        </label>
                                        <p>
                                            <span
                                                className={`px-2 py-1 rounded ${getStatusBadge(
                                                    viewingReturn.status
                                                )}`}
                                            >
                                                {getStatusLabel(
                                                    viewingReturn.status
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="font-semibold">
                                            Kho:
                                        </label>
                                        <p>{viewingReturn.warehouse?.name}</p>
                                    </div>
                                    <div>
                                        <label className="font-semibold">
                                            Khách hàng:
                                        </label>
                                        <p>
                                            {viewingReturn.customer?.name ||
                                                "N/A"}
                                            {viewingReturn.customer?.phone &&
                                                ` - ${viewingReturn.customer.phone}`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="font-semibold">
                                            Ngày tạo:
                                        </label>
                                        <p>
                                            {viewingReturn.createdAt
                                                ? new Date(
                                                      viewingReturn.createdAt
                                                  ).toLocaleString("vi-VN")
                                                : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="font-semibold">
                                            Tổng hoàn trả:
                                        </label>
                                        <p className="font-bold text-emerald-600">
                                            {formatCurrency(
                                                viewingReturn.totalRefund || 0
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-semibold">
                                        Lý do trả hàng:
                                    </label>
                                    <p className="text-gray-600">
                                        {viewingReturn.reason || "Không có"}
                                    </p>
                                </div>

                                {viewingReturn.order && (
                                    <div>
                                        <label className="font-semibold">
                                            Đơn hàng gốc:
                                        </label>
                                        <p>
                                            {viewingReturn.order.orderNo ||
                                                "N/A"}
                                        </p>
                                    </div>
                                )}

                                {viewingReturn.createdBy && (
                                    <div>
                                        <label className="font-semibold">
                                            Người tạo:
                                        </label>
                                        <p>
                                            {viewingReturn.createdBy.name ||
                                                "N/A"}
                                        </p>
                                    </div>
                                )}

                                {viewingReturn.approvedBy && (
                                    <div>
                                        <label className="font-semibold">
                                            Người duyệt:
                                        </label>
                                        <p>
                                            {viewingReturn.approvedBy.name ||
                                                "N/A"}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Danh sách sản phẩm:
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
                                                    Giá hoàn trả
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Thành tiền
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {viewingReturn.items?.map(
                                                (item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2">
                                                            {item.productUnit
                                                                ?.name || "N/A"}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {formatCurrency(
                                                                item.refundAmount ||
                                                                    0
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 font-semibold">
                                                            {formatCurrency(
                                                                (item.quantity ||
                                                                    0) *
                                                                    (item.refundAmount ||
                                                                        0)
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
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
