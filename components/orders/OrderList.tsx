import React, { useMemo } from 'react';
import { Search, Filter, AlertCircle, Clock, Trash2, RefreshCcw } from 'lucide-react';
import { Order } from '../../types';
import { calculateExpiry } from '../../utils/date';
import { formatCurrency } from '../../utils/format';

interface OrderListProps {
    orders: Order[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: 'all' | 'active' | 'expired' | 'cancelled';
    setStatusFilter: (status: 'all' | 'active' | 'expired' | 'cancelled') => void;
    onOpenRefundModal: (order: Order) => void;
    onRequestDelete: (id: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({
    orders,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    onOpenRefundModal,
    onRequestDelete
}) => {
    // Filter Orders Logic
    const filteredOrders = useMemo(() => orders.filter(order => {
        let matchesStatus = true;

        if (statusFilter !== 'all') {
            if (statusFilter === 'cancelled') {
                matchesStatus = order.status === 'cancelled';
            } else {
                if (order.status === 'cancelled') {
                    matchesStatus = false;
                } else {
                    const hasActiveItem = order.items.some(item => {
                        const expiryDate = calculateExpiry(order.createdAt, item.usageTime);
                        if (!expiryDate) return true;
                        return new Date() <= expiryDate;
                    });

                    if (statusFilter === 'active') matchesStatus = hasActiveItem;
                    if (statusFilter === 'expired') matchesStatus = !hasActiveItem;
                }
            }
        }

        const term = searchTerm.toLowerCase();
        const matchesSearch =
            order.customerName.toLowerCase().includes(term) ||
            order.customerPhone.includes(term) ||
            order.id.toLowerCase().includes(term);

        return matchesStatus && matchesSearch;
    }), [orders, statusFilter, searchTerm]);

    return (
        <div className="space-y-4">
            {/* Search and Filter Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Search */}
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm tên khách, SĐT, mã đơn..."
                        className="w-full md:w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                    <Filter size={16} className="text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer"
                    >
                        <option value="all">Tất cả</option>
                        <option value="active">Còn hạn</option>
                        <option value="expired">Hết hạn</option>
                        <option value="cancelled">Đã hủy/Hoàn</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Mã Đơn</th>
                            <th className="px-6 py-4">Khách Hàng</th>
                            <th className="px-6 py-4">Sản Phẩm</th>
                            <th className="px-6 py-4">Ngày Hết Hạn</th>
                            <th className="px-6 py-4 text-right">Tổng Tiền</th>
                            <th className="px-6 py-4 text-right">Ngày Tạo</th>
                            <th className="px-6 py-4 text-center">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                    {orders.length === 0 ? "Chưa có đơn hàng nào." : "Không tìm thấy đơn hàng phù hợp."}
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => {
                                const isCancelled = order.status === 'cancelled';
                                return (
                                    <tr key={order.id} className={`hover:bg-gray-50 transition group ${isCancelled ? 'bg-gray-50 opacity-75' : ''}`}>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 align-top">
                                            #{order.id.slice(0, 6)}
                                            {isCancelled && <div className="text-[10px] font-bold text-red-500 uppercase mt-1">Đã hủy</div>}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-medium text-gray-800">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="space-y-3">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1 border-b border-gray-100 last:border-0 pb-2 last:pb-0 h-[3.5rem] justify-center">
                                                        <div className="text-sm text-gray-800 font-medium flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCancelled ? 'bg-red-400' : 'bg-gray-400'}`}></span>
                                                            <span className={`truncate ${isCancelled ? 'line-through text-gray-400' : ''}`}>{item.productName}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="space-y-3">
                                                {order.items.map((item, idx) => {
                                                    const expiryDate = calculateExpiry(order.createdAt, item.usageTime);
                                                    const isExpired = expiryDate ? new Date() > expiryDate : false;

                                                    if (isCancelled) return <div key={idx} className="h-[3.5rem] flex items-center text-xs text-gray-400 italic">Đơn đã hủy</div>;

                                                    return (
                                                        <div key={idx} className="flex items-center gap-2 border-b border-gray-100 last:border-0 pb-2 last:pb-0 h-[3.5rem]">
                                                            {isExpired ? (
                                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                                                                    <AlertCircle size={10} /> Hết hạn
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                                                                    <Clock size={10} /> Còn hạn
                                                                </span>
                                                            )}
                                                            <span className={`text-xs font-medium ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                                                                {expiryDate
                                                                    ? expiryDate.toLocaleDateString('vi-VN')
                                                                    : 'Vĩnh viễn'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right align-top pt-8">
                                            <div className={`font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                                                {formatCurrency(order.totalAmount)}
                                            </div>
                                            {isCancelled && order.refundInfo && (
                                                <div className="text-xs text-red-500 font-medium mt-1">
                                                    Hoàn: -{formatCurrency(order.refundInfo.refundToCustomer)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-gray-500 align-top pt-9">
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-center align-top pt-8">
                                            {!isCancelled && (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => onOpenRefundModal(order)}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                                                        title="Hủy & Hoàn Đơn"
                                                    >
                                                        <RefreshCcw size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => onRequestDelete(order.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="Xóa vĩnh viễn"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderList;
