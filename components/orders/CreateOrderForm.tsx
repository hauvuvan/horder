import React, { useState } from 'react';
import { User, Search, CheckCircle, Package, ListPlus, Trash2 } from 'lucide-react';
import { Customer, Product, OrderItem } from '../../types';
import { formatCurrency } from '../../utils/format';

interface CreateOrderFormProps {
    products: Product[];
    customers: Customer[];
    loading: boolean;
    onSubmit: (e: React.FormEvent, data: any) => void;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
    products,
    customers,
    loading,
    onSubmit
}) => {
    // Create Order State
    const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('existing');

    // Selection State
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [searchCustTerm, setSearchCustTerm] = useState('');

    // New Customer Form
    const [newCustData, setNewCustData] = useState({
        name: '',
        email: '',
        phone: '',
        fbLink: ''
    });

    // Order Item State (Staging)
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [usageTime, setUsageTime] = useState('');
    const [overridePrice, setOverridePrice] = useState<string>('');

    // Cart State (Multiple Items)
    const [pendingItems, setPendingItems] = useState<OrderItem[]>([]);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchCustTerm.toLowerCase()) ||
        c.phone.includes(searchCustTerm)
    );

    const selectedProductObj = products.find(p => p.id === selectedProductId);

    const handleProductChange = (productId: string) => {
        setSelectedProductId(productId);
        setSelectedVariantId('');
        setUsageTime('');
        setOverridePrice('');
    };

    const handleVariantChange = (variantId: string) => {
        setSelectedVariantId(variantId);
        if (selectedProductObj) {
            const variant = selectedProductObj.variants.find(v => v.id === variantId);
            if (variant) {
                setUsageTime(variant.duration);
                setOverridePrice(variant.sellPrice.toString());
            } else {
                setUsageTime('');
                setOverridePrice('');
            }
        }
    };

    const handleAddItem = () => {
        if (!selectedProductId) return alert("Vui lòng chọn sản phẩm");
        if (!selectedVariantId) return alert("Vui lòng chọn gói (biến thể)");
        if (!usageTime) return alert("Vui lòng xác nhận thời gian sử dụng");

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const variant = product.variants.find(v => v.id === selectedVariantId);
        if (!variant) return;

        const price = overridePrice !== '' ? Number(overridePrice) : variant.sellPrice;

        // Create item with specific variant pricing
        const newItem: OrderItem = {
            productId: product.id,
            productName: `${product.name} (${variant.duration})`,
            priceAtSale: price,
            costAtSale: variant.importPrice, // Accurate profit calculation based on specific variant
            usageTime: usageTime
        };

        setPendingItems([...pendingItems, newItem]);

        // Reset staging
        setSelectedProductId('');
        setSelectedVariantId('');
        setOverridePrice('');
        setUsageTime('');
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...pendingItems];
        newItems.splice(index, 1);
        setPendingItems(newItems);
    };

    const getCurrentTotal = () => pendingItems.reduce((sum, item) => sum + item.priceAtSale, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            customerMode,
            selectedCustomerId,
            newCustData,
            pendingItems,
            // Helper to reset form
            resetForm: () => {
                setNewCustData({ name: '', email: '', phone: '', fbLink: '' });
                setSelectedCustomerId('');
                setPendingItems([]);
                setSearchCustTerm('');
            }
        };

        onSubmit(e, submitData);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Customer Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <User size={20} className="text-indigo-600" /> Thông tin khách hàng
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCustomerMode('existing')}
                                    className={`px-3 py-1 text-xs font-bold rounded border ${customerMode === 'existing' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-500'}`}
                                >
                                    Khách Cũ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCustomerMode('new')}
                                    className={`px-3 py-1 text-xs font-bold rounded border ${customerMode === 'new' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-500'}`}
                                >
                                    Khách Mới
                                </button>
                            </div>
                        </div>

                        {customerMode === 'existing' ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tìm khách hàng (Tên, SĐT)..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={searchCustTerm}
                                        onChange={(e) => setSearchCustTerm(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setSelectedCustomerId(c.id)}
                                                className={`p-3 cursor-pointer flex justify-between items-center hover:bg-gray-50 ${selectedCustomerId === c.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800">{c.name}</p>
                                                    <p className="text-xs text-gray-500">{c.phone}</p>
                                                </div>
                                                {selectedCustomerId === c.id && <CheckCircle size={16} className="text-indigo-600" />}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy khách hàng.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Tên khách hàng *</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-indigo-500 outline-none"
                                        value={newCustData.name}
                                        onChange={(e) => setNewCustData({ ...newCustData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Số điện thoại *</label>
                                    <input
                                        type="tel" required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-indigo-500 outline-none"
                                        value={newCustData.phone}
                                        onChange={(e) => setNewCustData({ ...newCustData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-indigo-500 outline-none"
                                        value={newCustData.email}
                                        onChange={(e) => setNewCustData({ ...newCustData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Link Facebook</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-indigo-500 outline-none"
                                        value={newCustData.fbLink}
                                        onChange={(e) => setNewCustData({ ...newCustData, fbLink: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Product Info & Cart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                            <Package size={20} className="text-indigo-600" /> Thêm sản phẩm
                        </h3>

                        {/* Product Selection Inputs */}
                        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">1. Chọn sản phẩm</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 outline-none bg-white text-gray-900"
                                        value={selectedProductId}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                    >
                                        <option value="">-- Chọn sản phẩm --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">2. Chọn gói (Thời hạn)</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 outline-none bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                                        value={selectedVariantId}
                                        onChange={(e) => handleVariantChange(e.target.value)}
                                        disabled={!selectedProductId}
                                    >
                                        <option value="">-- Chọn gói --</option>
                                        {selectedProductObj && selectedProductObj.variants ? (
                                            selectedProductObj.variants.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.duration} - {formatCurrency(v.sellPrice)}
                                                </option>
                                            ))
                                        ) : null}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Giá bán (VNĐ)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-indigo-500 outline-none"
                                        value={overridePrice}
                                        onChange={(e) => setOverridePrice(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Thời gian sử dụng</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:ring-0 outline-none cursor-not-allowed"
                                        value={usageTime}
                                        readOnly
                                        placeholder="Tự động theo gói..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition flex items-center gap-2"
                                >
                                    <ListPlus size={16} /> Thêm vào đơn
                                </button>
                            </div>
                        </div>

                        {/* Selected Items List (Cart) */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Sản phẩm đã chọn ({pendingItems.length})</h4>
                            {pendingItems.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                                    Chưa có sản phẩm nào trong đơn hàng.
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-600 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3">Tên sản phẩm</th>
                                                <th className="px-4 py-3">Thời hạn</th>
                                                <th className="px-4 py-3 text-right">Giá bán</th>
                                                <th className="px-4 py-3 text-center">Xóa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {pendingItems.map((item, index) => (
                                                <tr key={index} className="bg-white">
                                                    <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                                                    <td className="px-4 py-3 text-gray-600">{item.usageTime}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                                        {formatCurrency(item.priceAtSale)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={pendingItems.length === 0 || loading}
                            className={`px-8 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 ${pendingItems.length === 0 || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
                        >
                            <CheckCircle size={20} /> {loading ? 'Đang xử lý...' : 'Hoàn tất đơn hàng'}
                        </button>
                    </div>
                </form>
            </div>
            {/* Summary Card */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 sticky top-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Tạm tính</h4>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Khách hàng:</span>
                            <span className="font-medium text-right text-gray-800">
                                {customerMode === 'new'
                                    ? (newCustData.name || '---')
                                    : (customers.find(c => c.id === selectedCustomerId)?.name || '---')
                                }
                            </span>
                        </div>

                        <div className="py-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Chi tiết đơn hàng</span>
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                {pendingItems.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate w-32" title={item.productName}>{item.productName}</span>
                                        <span className="font-medium text-gray-800">{formatCurrency(item.priceAtSale)}</span>
                                    </div>
                                ))}
                                {pendingItems.length === 0 && <p className="text-sm text-gray-400 italic">Trống</p>}
                            </div>
                        </div>

                        <div className="border-t border-dashed pt-4 flex justify-between items-center">
                            <span className="font-bold text-gray-800">Tổng cộng:</span>
                            <span className="text-xl font-bold text-indigo-600">{formatCurrency(getCurrentTotal())}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateOrderForm;
