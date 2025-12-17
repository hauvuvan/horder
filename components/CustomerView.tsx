import React, { useState, useEffect } from 'react';
import { Search, Facebook, Phone, Mail, ShoppingBag, X } from 'lucide-react';
import { Customer, Order, formatCurrency } from '../types';
import * as db from '../services/storage';

const CustomerView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [custs, ords] = await Promise.all([
        db.getCustomers(),
        db.getOrders()
      ]);
      setCustomers(custs);
      setOrders(ords);
      setLoading(false);
    };
    init();
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerHistory = (customerId: string) => {
    return orders.filter(o => o.customerId === customerId);
  };

  if (loading) return <div className="flex justify-center p-10"><div className="loader"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Khách Hàng</h2>
          <p className="text-sm text-gray-500">Xem thông tin và lịch sử mua hàng</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm tên, SĐT, Email..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            Không tìm thấy khách hàng nào.
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const history = getCustomerHistory(customer.id);
            const totalSpent = history.reduce((sum, order) => sum + order.totalAmount, 0);

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
                    {history.length} đơn
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-1">{customer.name}</h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                  <Phone size={14} /> {customer.phone}
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    <Mail size={14} className="shrink-0" /> {customer.email || 'N/A'}
                  </div>
                  {customer.fbLink && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Facebook size={14} className="shrink-0" /> Facebook Profile
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tổng chi tiêu:</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <ShoppingBag size={20} className="text-indigo-600" />
                Lịch sử mua hàng: {selectedCustomer.name}
              </h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-indigo-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-indigo-400 uppercase font-bold mb-2">Liên hệ</p>
                  <div className="space-y-1">
                    <p className="text-gray-800 font-medium flex items-center gap-2">
                      <Phone size={14} className="text-indigo-500" /> {selectedCustomer.phone}
                    </p>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <Mail size={14} className="text-indigo-500" /> {selectedCustomer.email || 'Chưa có email'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-indigo-400 uppercase font-bold">Mạng xã hội</p>
                  {selectedCustomer.fbLink ? (
                    <a href={selectedCustomer.fbLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                      {selectedCustomer.fbLink}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">Không có link FB</span>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-3">Đơn hàng đã mua</h4>
              <div className="space-y-4">
                {getCustomerHistory(selectedCustomer.id).length === 0 ? (
                  <p className="text-gray-500 italic">Khách hàng chưa mua sản phẩm nào.</p>
                ) : (
                  getCustomerHistory(selectedCustomer.id).map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </span>
                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>• {item.productName}</span>
                            <div className="text-right">
                              <span className="text-gray-600 mr-3">{item.usageTime}</span>
                              <span className="font-medium">{formatCurrency(item.priceAtSale)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;