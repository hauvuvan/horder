import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, X } from 'lucide-react';
import { Product, Customer, Order } from '../types';
import * as db from '../services/storage';
import { getDurationDays } from '../utils/date';
import OrderList from './orders/OrderList';
import CreateOrderForm from './orders/CreateOrderForm';
import RefundModal from './orders/RefundModal';

interface OrderViewProps {
  initialTab?: 'list' | 'create';
}

const OrderView: React.FC<OrderViewProps> = ({ initialTab = 'list' }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Data for creation
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundToCustomer, setRefundToCustomer] = useState<number>(0);
  const [refundFromSupplier, setRefundFromSupplier] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteOrderInfo, setDeleteOrderInfo] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = async () => {
    setLoading(true);
    const [o, p, c] = await Promise.all([
      db.getOrders(),
      db.getProducts(),
      db.getCustomers()
    ]);
    setOrders(o);
    setProducts(p);
    setCustomers(c);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleCreateOrder = async (e: React.FormEvent, data: any) => {
    const { customerMode, selectedCustomerId, newCustData, pendingItems, orderNotes, resetForm } = data;

    if (pendingItems.length === 0) return alert("Vui lòng thêm ít nhất một sản phẩm vào đơn hàng");

    let finalCustomerId = selectedCustomerId;
    let finalCustName = '';
    let finalCustPhone = '';

    setLoading(true);

    if (customerMode === 'new') {
      if (!newCustData.name || !newCustData.phone) {
        setLoading(false);
        return alert("Vui lòng điền tên và số điện thoại khách hàng");
      }
      const newCust = await db.createCustomer(newCustData);
      finalCustomerId = newCust.id;
      finalCustName = newCust.name;
      finalCustPhone = newCust.phone;
    } else {
      if (!selectedCustomerId) {
        setLoading(false);
        return alert("Vui lòng chọn khách hàng cũ");
      }
      const existCust = customers.find(c => c.id === selectedCustomerId);
      if (existCust) {
        finalCustName = existCust.name;
        finalCustPhone = existCust.phone;
      }
    }

    await db.createOrder(finalCustomerId, finalCustName, finalCustPhone, pendingItems, orderNotes, data.orderDate);

    await loadData();
    setActiveTab('list');
    resetForm();
    setLoading(false);
  };

  // --- Refund / Cancellation Logic ---

  const handleOpenRefundModal = (order: Order) => {
    setRefundOrder(order);
    setRefundReason('');
    setRefundFromSupplier(0);

    // Auto Calculate Recommended Refund
    let totalRecommendedRefund = 0;
    const now = new Date();
    const created = new Date(order.createdAt);
    const usedMs = now.getTime() - created.getTime();
    const usedDays = usedMs / (1000 * 60 * 60 * 24);

    order.items.forEach(item => {
      const totalDays = getDurationDays(item.usageTime);
      if (totalDays > 0) {
        const remainingDays = Math.max(0, totalDays - usedDays);
        const ratio = remainingDays / totalDays;
        totalRecommendedRefund += Math.floor(item.priceAtSale * ratio);
      }
    });

    setRefundToCustomer(totalRecommendedRefund);
    setIsRefundModalOpen(true);
  };

  const handleSubmitRefund = async () => {
    if (!refundOrder) return;
    setLoading(true);
    const updatedOrder: Order = {
      ...refundOrder,
      status: 'cancelled',
      refundInfo: {
        refundToCustomer: Number(refundToCustomer),
        refundFromSupplier: Number(refundFromSupplier),
        refundDate: new Date().toISOString(),
        reason: refundReason
      }
    };

    await db.updateOrder(updatedOrder);
    await loadData();
    setIsRefundModalOpen(false);
    setRefundOrder(null);
    setLoading(false);
  };

  // --- Delete Logic ---
  const onRequestDelete = (id: string) => {
    const order = orders.find(o => o.id === id);
    setDeleteOrderInfo({ id, name: order?.customerName || 'Đơn hàng' });
    setIsDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (!deleteOrderInfo) return;
    setLoading(true);

    // Get the order to find its customerId before deleting
    const orderToDelete = orders.find(o => o.id === deleteOrderInfo.id);
    const customerId = orderToDelete?.customerId;

    // Delete the order
    await db.deleteOrder(deleteOrderInfo.id);

    // Check if customer has any other orders
    if (customerId) {
      const remainingOrders = orders.filter(o => o.customerId === customerId && o.id !== deleteOrderInfo.id);
      if (remainingOrders.length === 0) {
        // Customer has no more orders, delete them too
        await db.deleteCustomer(customerId);
      }
    }

    await loadData();
    setLoading(false);
    setIsDeleteModalOpen(false);
    setDeleteOrderInfo(null);
  };


  if (loading && orders.length === 0) {
    return <div className="flex justify-center p-12"><div className="loader"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Đơn Hàng</h2>
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Danh sách đơn
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <Plus size={16} /> Tạo đơn mới
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <CreateOrderForm
          products={products}
          customers={customers}
          loading={loading}
          onSubmit={handleCreateOrder}
        />
      ) : (
        <OrderList
          orders={orders}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onOpenRefundModal={handleOpenRefundModal}
          onRequestDelete={onRequestDelete}
          onUpdateOrder={async (updatedOrder) => {
            setLoading(true);
            await db.updateOrder(updatedOrder);
            await loadData();
            setLoading(false);
          }}
        />
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && refundOrder && (
        <RefundModal
          refundOrder={refundOrder}
          refundToCustomer={refundToCustomer}
          setRefundToCustomer={setRefundToCustomer}
          refundFromSupplier={refundFromSupplier}
          setRefundFromSupplier={setRefundFromSupplier}
          refundReason={refundReason}
          setRefundReason={setRefundReason}
          onClose={() => setIsRefundModalOpen(false)}
          onSubmit={handleSubmitRefund}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteOrderInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                Xác nhận xóa đơn hàng
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <p className="font-medium">Bạn có chắc chắn muốn xóa đơn hàng của <strong>{deleteOrderInfo.name}</strong>?</p>
                <p className="mt-2 text-red-600">⚠️ Hành động này không thể hoàn tác!</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> {loading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderView;