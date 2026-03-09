import React, { useState, useEffect, useMemo } from 'react';
import { Search, Facebook, Phone, Mail, ShoppingBag, X, Edit, Save, Users, TrendingUp, ArrowUpDown, Trash2, AlertTriangle, ExternalLink, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { Customer, Order, formatCurrency } from '../types';
import * as db from '../services/storage';

type SortKey = 'name' | 'orders' | 'spent' | 'recent';
type SortDir = 'asc' | 'desc';

const CustomerView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Sort State
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', fbLink: '' });

  // Delete Mode State
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [custs, ords] = await Promise.all([
      db.getCustomers(),
      db.getOrders()
    ]);
    setCustomers(custs);
    setOrders(ords);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-compute customer stats
  const customerStats = useMemo(() => {
    const statsMap = new Map<string, { orderCount: number; totalSpent: number; lastOrderDate: string }>();
    customers.forEach(c => {
      const custOrders = orders.filter(o => o.customerId === c.id);
      const totalSpent = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const lastOrder = custOrders.length > 0
        ? custOrders.reduce((latest, o) => o.createdAt > latest ? o.createdAt : latest, custOrders[0].createdAt)
        : c.createdAt;
      statsMap.set(c.id, { orderCount: custOrders.length, totalSpent, lastOrderDate: lastOrder });
    });
    return statsMap;
  }, [customers, orders]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = Array.from(customerStats.values()).reduce((sum, s) => sum + s.totalSpent, 0);
    const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const topSpender = customers.reduce((top, c) => {
      const spent = customerStats.get(c.id)?.totalSpent || 0;
      const topSpent = top ? (customerStats.get(top.id)?.totalSpent || 0) : 0;
      return spent > topSpent ? c : top;
    }, null as Customer | null);
    return { totalCustomers, totalRevenue, avgSpent, topSpender };
  }, [customers, customerStats]);

  // Filter + Sort
  const filteredCustomers = useMemo(() => {
    let result = customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    result.sort((a, b) => {
      const statsA = customerStats.get(a.id);
      const statsB = customerStats.get(b.id);
      let cmp = 0;

      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'vi');
          break;
        case 'orders':
          cmp = (statsA?.orderCount || 0) - (statsB?.orderCount || 0);
          break;
        case 'spent':
          cmp = (statsA?.totalSpent || 0) - (statsB?.totalSpent || 0);
          break;
        case 'recent':
          cmp = (statsA?.lastOrderDate || '').localeCompare(statsB?.lastOrderDate || '');
          break;
      }

      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [customers, searchTerm, sortKey, sortDir, customerStats]);

  const getCustomerHistory = (customerId: string) => {
    return orders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleEditClick = () => {
    if (selectedCustomer) {
      setEditForm({
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email || '',
        fbLink: selectedCustomer.fbLink || ''
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    const updatedCustomer: Customer = {
      ...selectedCustomer,
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      fbLink: editForm.fbLink
    };
    await db.updateCustomer(updatedCustomer);
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setSelectedCustomer(updatedCustomer);
    setIsEditing(false);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomer) return;
    setLoading(true);
    await db.deleteCustomer(deleteCustomer.id);
    await fetchData();
    setDeleteCustomer(null);
    setSelectedCustomer(null);
    setLoading(false);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={12} className="text-gray-300 ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-indigo-600 ml-1" />
      : <ChevronDown size={14} className="text-indigo-600 ml-1" />;
  };

  if (loading) return <div className="flex justify-center p-10"><div className="loader"></div></div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Khách Hàng</h2>
          <p className="text-sm text-gray-500">Quản lý thông tin và lịch sử mua hàng</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm tên, SĐT, Email..."
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl w-full md:w-72 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng khách hàng</p>
            <p className="text-xl font-bold text-gray-800">{summaryStats.totalCustomers}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng doanh thu từ KH</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(summaryStats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <ShoppingBag size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Chi tiêu TB / khách</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(summaryStats.avgSpent)}</p>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 cursor-pointer select-none hover:text-indigo-600 transition" onClick={() => handleSort('name')}>
                <span className="flex items-center">Khách Hàng <SortIcon column="name" /></span>
              </th>
              <th className="px-6 py-4">Liên Hệ</th>
              <th className="px-6 py-4 text-center cursor-pointer select-none hover:text-indigo-600 transition" onClick={() => handleSort('orders')}>
                <span className="flex items-center justify-center">Đơn Hàng <SortIcon column="orders" /></span>
              </th>
              <th className="px-6 py-4 text-right cursor-pointer select-none hover:text-indigo-600 transition" onClick={() => handleSort('spent')}>
                <span className="flex items-center justify-end">Tổng Chi Tiêu <SortIcon column="spent" /></span>
              </th>
              <th className="px-6 py-4 text-right cursor-pointer select-none hover:text-indigo-600 transition" onClick={() => handleSort('recent')}>
                <span className="flex items-center justify-end">Hoạt Động <SortIcon column="recent" /></span>
              </th>
              <th className="px-6 py-4 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {customers.length === 0 ? 'Chưa có khách hàng nào.' : 'Không tìm thấy khách hàng phù hợp.'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => {
                const stats = customerStats.get(customer.id);
                const orderCount = stats?.orderCount || 0;
                const totalSpent = stats?.totalSpent || 0;
                const lastDate = stats?.lastOrderDate || customer.createdAt;

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-indigo-50/50 transition cursor-pointer group"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Avatar + Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 group-hover:shadow-md group-hover:shadow-indigo-200 transition">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{customer.name}</p>
                          {customer.fbLink && (
                            <a
                              href={customer.fbLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Facebook size={10} /> Facebook
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Phone size={12} className="text-gray-400 shrink-0" /> {customer.phone}
                        </p>
                        {customer.email && customer.email !== 'N/A' && (
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate max-w-[200px]">
                            <Mail size={12} className="text-gray-400 shrink-0" /> {customer.email}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Order Count */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${orderCount >= 3
                          ? 'bg-emerald-100 text-emerald-700'
                          : orderCount > 0
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                        {orderCount} đơn
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${totalSpent > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {formatCurrency(totalSpent)}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="px-6 py-4 text-right text-xs text-gray-500">
                      {new Date(lastDate).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            handleEditClick();
                          }}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Chỉnh sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteCustomer(customer)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer with count */}
        {filteredCustomers.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>Hiển thị {filteredCustomers.length} / {customers.length} khách hàng</span>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-indigo-600 hover:text-indigo-800 font-medium">
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ShoppingBag size={20} className="text-indigo-600" />
                {isEditing ? 'Chỉnh sửa thông tin' : `Chi tiết: ${selectedCustomer.name}`}
              </h3>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button onClick={handleEditClick} className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition" title="Chỉnh sửa">
                    <Edit size={16} />
                  </button>
                )}
                <button onClick={() => { setSelectedCustomer(null); setIsEditing(false); }} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Edit Form */}
              {isEditing ? (
                <div className="space-y-4 mb-6 bg-yellow-50 p-5 rounded-xl border border-yellow-200">
                  <h4 className="font-bold text-gray-800 mb-3">Chỉnh sửa thông tin khách hàng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Tên khách hàng *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Link Facebook</label>
                      <input
                        type="text"
                        value={editForm.fbLink}
                        onChange={(e) => setEditForm({ ...editForm, fbLink: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      <Save size={16} /> Lưu thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                /* Info Section */
                <div className="grid grid-cols-2 gap-4 mb-6 bg-indigo-50 p-5 rounded-xl">
                  <div>
                    <p className="text-xs text-indigo-400 uppercase font-bold mb-2">Liên hệ</p>
                    <div className="space-y-1.5">
                      <p className="text-gray-800 font-medium flex items-center gap-2">
                        <Phone size={14} className="text-indigo-500" /> {selectedCustomer.phone}
                      </p>
                      <p className="text-gray-600 text-sm flex items-center gap-2">
                        <Mail size={14} className="text-indigo-500" /> {selectedCustomer.email || 'Chưa có email'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-400 uppercase font-bold mb-2">Mạng xã hội</p>
                    {selectedCustomer.fbLink ? (
                      <a href={selectedCustomer.fbLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all flex items-center gap-1">
                        <ExternalLink size={12} /> {selectedCustomer.fbLink}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Không có link FB</span>
                    )}
                    <div className="mt-3">
                      <p className="text-xs text-indigo-400 uppercase font-bold mb-1">Thống kê</p>
                      <div className="flex gap-4">
                        <span className="text-sm"><b className="text-indigo-600">{customerStats.get(selectedCustomer.id)?.orderCount || 0}</b> đơn</span>
                        <span className="text-sm"><b className="text-emerald-600">{formatCurrency(customerStats.get(selectedCustomer.id)?.totalSpent || 0)}</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                Đơn hàng đã mua ({getCustomerHistory(selectedCustomer.id).length})
              </h4>
              <div className="space-y-3">
                {getCustomerHistory(selectedCustomer.id).length === 0 ? (
                  <p className="text-gray-500 italic text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">Khách hàng chưa mua sản phẩm nào.</p>
                ) : (
                  getCustomerHistory(selectedCustomer.id).map(order => (
                    <div key={order.id} className={`border rounded-lg p-4 transition ${order.status === 'cancelled' ? 'bg-red-50/50 border-red-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          {order.status === 'cancelled' && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Đã hủy</span>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">• {item.productName}</span>
                            <div className="text-right flex items-center gap-3">
                              <span className="text-gray-400 text-xs">{item.usageTime}</span>
                              <span className="font-medium text-gray-700 w-24 text-right">{formatCurrency(item.priceAtSale)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded italic">📝 {order.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa?</h3>
              <p className="text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa khách hàng <strong>{deleteCustomer.name}</strong>? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteCustomer(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-200"
                >
                  {loading ? '...' : 'Xác nhận Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;