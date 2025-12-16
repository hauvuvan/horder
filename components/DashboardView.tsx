import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, ShoppingCart, PlusCircle, Calendar, Wallet, Database, Download, Upload, ArrowRight } from 'lucide-react';
import { getOrders, getCustomers, backupData, restoreData } from '../services/storage';
import { formatCurrency, Order } from '../types';

interface DashboardViewProps {
  onCreateOrder: () => void;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all' | 'custom';

const DashboardView: React.FC<DashboardViewProps> = ({ onCreateOrder }) => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('month');
  
  // Custom Date Range State
  const [customStart, setCustomStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0,
    totalCustomers: 0,
    recentOrders: [] as Order[]
  });

  const fetchData = async () => {
    setLoading(true);
    const allOrders = await getOrders();
    const allCustomers = await getCustomers();

    // Filter Logic
    const now = new Date();
    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      switch (filter) {
        case 'today':
          return orderDate.getDate() === now.getDate() &&
                 orderDate.getMonth() === now.getMonth() &&
                 orderDate.getFullYear() === now.getFullYear();
        case 'week':
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= oneWeekAgo;
        case 'month':
          return orderDate.getMonth() === now.getMonth() &&
                 orderDate.getFullYear() === now.getFullYear();
        case 'custom':
          if (!customStart || !customEnd) return true;
          const start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          
          return orderDate >= start && orderDate <= end;
        case 'all':
        default:
          return true;
      }
    });

    // --- REVENUE & PROFIT CALCULATION ---
    let revenue = 0;
    let profit = 0;
    
    // Note: We count ALL valid orders within the timeframe for the "Total Orders" card
    const orderCount = filteredOrders.length;

    filteredOrders.forEach(order => {
      const orderTotal = order.totalAmount;
      const orderCost = order.items.reduce((sum, item) => sum + (item.costAtSale || 0), 0);
      
      if (order.status === 'cancelled' && order.refundInfo) {
        // CÔNG THỨC: 
        // Doanh thu = Tiền hàng - Tiền hoàn khách
        // Lợi nhuận = (Tiền hàng - Giá vốn - Tiền hoàn khách) + Tiền NCC hoàn
        
        const refundToCustomer = order.refundInfo.refundToCustomer || 0;
        const refundFromSupplier = order.refundInfo.refundFromSupplier || 0;

        revenue += (orderTotal - refundToCustomer);
        profit += (orderTotal - orderCost - refundToCustomer + refundFromSupplier);
      } else {
        // Normal Order
        revenue += orderTotal;
        profit += (orderTotal - orderCost);
      }
    });

    setStats({
      totalRevenue: revenue,
      totalProfit: profit,
      totalOrders: orderCount,
      totalCustomers: allCustomers.length,
      recentOrders: allOrders.slice(0, 5)
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter, customStart, customEnd]);

  const getFilterLabel = () => {
    switch(filter) {
      case 'today': return 'Hôm nay';
      case 'week': return '7 ngày qua';
      case 'month': return 'Tháng này';
      case 'all': return 'Toàn thời gian';
      case 'custom': 
        const s = new Date(customStart).toLocaleDateString('vi-VN', {day: '2-digit', month:'2-digit'});
        const e = new Date(customEnd).toLocaleDateString('vi-VN', {day: '2-digit', month:'2-digit'});
        return `${s} - ${e}`;
    }
  };

  const handleBackup = () => {
    backupData();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (confirm("CẢNH BÁO: Việc khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại. Tiếp tục?")) {
      restoreData(file, (success, msg) => {
        if (success) {
          alert("Khôi phục thành công! Trang sẽ tải lại.");
          window.location.reload();
        } else {
          alert(`Lỗi: ${msg}`);
        }
      });
    }
    e.target.value = '';
  };

  if (loading && stats.totalOrders === 0) {
    return <div className="flex justify-center items-center h-64"><div className="loader"></div></div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Quick Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Tổng Quan
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
              <Database size={12}/> IndexedDB (Browser)
            </span>
          </h2>
          <p className="text-sm text-gray-500">Báo cáo kinh doanh của bạn.</p>
        </div>
        
        <button 
          onClick={onCreateOrder}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 font-bold flex items-center gap-2 transition transform hover:-translate-y-0.5"
        >
          <PlusCircle size={20} />
          Tạo Đơn Hàng Ngay
        </button>
      </div>
      
      {/* Filter Section - UPDATED STYLING */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg w-fit shadow-sm border border-gray-200">
        <div className="flex items-center">
          <Calendar size={18} className="text-indigo-600 ml-2" />
          <span className="text-sm text-gray-700 font-bold mr-2 ml-2">Thời gian:</span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as TimeFilter)}
            className="bg-white border border-gray-300 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-md py-1.5 px-3 cursor-pointer outline-none transition shadow-sm"
          >
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này</option>
            <option value="all">Toàn thời gian</option>
            <option value="custom">Tùy chọn...</option>
          </select>
        </div>

        {filter === 'custom' && (
          <div className="flex items-center gap-2 ml-2 pl-3 border-l-2 border-gray-100 animate-in fade-in slide-in-from-left-2 duration-300">
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-medium shadow-sm"
            />
            <ArrowRight size={14} className="text-gray-400" />
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-medium shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg z-10">
            <TrendingUp size={24} />
          </div>
          <div className="z-10">
            <p className="text-sm text-gray-500">Doanh thu ({getFilterLabel()})</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg z-10">
            <Wallet size={24} />
          </div>
          <div className="z-10">
            <p className="text-sm text-gray-500">Lợi nhuận ({getFilterLabel()})</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalProfit)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg z-10">
            <ShoppingCart size={24} />
          </div>
          <div className="z-10">
            <p className="text-sm text-gray-500">Tổng Đơn hàng</p>
            <p className="text-xl font-bold text-gray-800">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng Khách hàng</p>
            <p className="text-xl font-bold text-gray-800">{stats.totalCustomers}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Đơn hàng mới nhất</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4 text-right">Trạng thái</th>
                <th className="px-6 py-4 text-right">Giá trị</th>
                <th className="px-6 py-4 text-right">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentOrders.length === 0 ? (
                 <tr><td colSpan={5} className="p-6 text-center text-gray-500">Chưa có dữ liệu</td></tr>
              ) : (
                stats.recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-800">{o.customerName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-[200px]">{o.items[0]?.productName} {o.items.length > 1 && `(+${o.items.length - 1})`}</td>
                    <td className="px-6 py-3 text-sm text-right">
                       {o.status === 'cancelled' ? (
                         <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Đã hoàn</span>
                       ) : (
                         <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Hoàn thành</span>
                       )}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-emerald-600">
                      {o.status === 'cancelled' && o.refundInfo 
                        ? <span className="line-through text-gray-400 mr-2 text-xs">{formatCurrency(o.totalAmount)}</span> 
                        : null
                      }
                      {o.status === 'cancelled' && o.refundInfo
                        ? formatCurrency(o.totalAmount - o.refundInfo.refundToCustomer)
                        : formatCurrency(o.totalAmount)
                      }
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Quản lý dữ liệu</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6 max-w-2xl">
          Hệ thống đang sử dụng <strong>IndexedDB</strong> của trình duyệt. Dữ liệu được lưu trữ an toàn, bền bỉ và không giới hạn dung lượng như LocalStorage. Hãy sao lưu định kỳ.
        </p>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleBackup}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
          >
            <Download size={18} /> Backup (.json)
          </button>
          
          <label className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition cursor-pointer">
            <Upload size={18} /> Restore
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;