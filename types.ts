export interface ProductVariant {
  id: string;
  duration: string; // 1 tháng, 1 năm...
  importPrice: number;
  sellPrice: number;
}

export interface Product {
  id: string;
  name: string; // Tên chung (Youtube Premium, Netflix...)
  source: string; // Nguồn nhập
  variants: ProductVariant[]; // Danh sách các gói
  lastUpdated: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  fbLink: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string; // Tên sản phẩm + Tên biến thể (VD: Youtube - 1 Tháng)
  priceAtSale: number; // Giá bán thực tế lúc tạo đơn
  costAtSale: number; // Giá nhập (giá vốn) lúc tạo đơn
  usageTime: string; // Thời gian sử dụng
}

export interface OrderRefund {
  refundToCustomer: number; // Tiền hoàn trả khách
  refundFromSupplier: number; // Tiền nhà cung cấp hoàn lại (nếu có)
  refundDate: string;
  reason?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string; // Snapshot for easier display
  customerPhone: string; // Snapshot
  items: OrderItem[];
  totalAmount: number;
  status: 'completed' | 'pending' | 'cancelled';
  refundInfo?: OrderRefund; // Thông tin hoàn tiền nếu status là cancelled
  createdAt: string;
}

export type ViewState = 'dashboard' | 'inventory' | 'customers' | 'orders' | 'account';

export const USAGE_OPTIONS = [
  '1 tháng',
  '2 tháng',
  '3 tháng',
  '6 tháng',
  '9 tháng',
  '1 năm',
  'Vĩnh viễn'
];

// Helper for currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Helper for ID generation
export const generateId = () => Math.random().toString(36).substr(2, 9);