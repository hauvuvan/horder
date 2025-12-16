import React from 'react';
import { RefreshCcw, XCircle } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/format';

interface RefundModalProps {
    refundOrder: Order | null;
    refundToCustomer: number;
    setRefundToCustomer: (val: number) => void;
    refundFromSupplier: number;
    setRefundFromSupplier: (val: number) => void;
    refundReason: string;
    setRefundReason: (val: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}

const RefundModal: React.FC<RefundModalProps> = ({
    refundOrder,
    refundToCustomer,
    setRefundToCustomer,
    refundFromSupplier,
    setRefundFromSupplier,
    refundReason,
    setRefundReason,
    onClose,
    onSubmit
}) => {
    if (!refundOrder) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <RefreshCcw size={20} className="text-orange-500" />
                        Hủy Đơn & Hoàn Tiền
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-orange-800 mb-4">
                        Bạn đang hủy đơn hàng <strong>#{refundOrder.id.slice(0, 6)}</strong>.
                        Hệ thống đã tự động tính số tiền hoàn trả gợi ý dựa trên thời gian sử dụng còn lại.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hoàn tiền cho khách (VNĐ)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={refundToCustomer}
                                onChange={(e) => setRefundToCustomer(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none font-bold"
                            />
                            <div className="absolute right-3 top-2 text-xs text-gray-400 pointer-events-none">
                                Gợi ý: {formatCurrency(refundToCustomer)}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            *Tự động tính: (Thời gian còn lại / Tổng thời gian) * Giá trị đơn
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nhà cung cấp hoàn lại (VNĐ)
                        </label>
                        <input
                            type="number"
                            value={refundFromSupplier}
                            onChange={(e) => setRefundFromSupplier(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-orange-500 outline-none"
                            placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Số tiền bạn được hoàn lại từ nguồn nhập (nếu có).
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lý do hủy đơn
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-orange-500 outline-none"
                            placeholder="Ví dụ: Khách không hài lòng, lỗi kỹ thuật..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={onSubmit}
                            className="flex-1 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition"
                        >
                            Xác nhận Hủy Đơn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundModal;
