import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, ProductVariant, formatCurrency, generateId, USAGE_OPTIONS } from '../types';
import * as db from '../services/storage';

const InventoryView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null); 
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    source: string;
    variants: ProductVariant[];
  }>({
    name: '',
    source: '',
    variants: []
  });

  const fetchProducts = async () => {
    setLoading(true);
    const data = await db.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        source: product.source,
        variants: product.variants ? [...product.variants] : []
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        source: '',
        variants: [{ id: generateId(), duration: USAGE_OPTIONS[0], importPrice: 0, sellPrice: 0 }]
      });
    }
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: generateId(), duration: USAGE_OPTIONS[0], importPrice: 0, sellPrice: 0 }]
    }));
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.variants.length === 0) {
      alert("Vui lòng điền tên sản phẩm và ít nhất 1 biến thể giá.");
      return;
    }

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : generateId(),
      name: formData.name,
      source: formData.source || '',
      variants: formData.variants.map(v => ({
        ...v,
        importPrice: Number(v.importPrice),
        sellPrice: Number(v.sellPrice)
      })),
      lastUpdated: new Date().toISOString(),
    };

    setLoading(true);
    await db.saveProduct(productToSave);
    await fetchProducts();
    setIsModalOpen(false);
  };

  const onRequestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setLoading(true);
      await db.deleteProduct(deleteId);
      await fetchProducts();
      setDeleteId(null);
    }
  };

  const getPriceRange = (variants: ProductVariant[]) => {
    if (!variants || variants.length === 0) return 'Chưa có giá';
    const prices = variants.map(v => v.sellPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kho Hàng Hóa</h2>
          <p className="text-sm text-gray-500">Quản lý các gói sản phẩm và giá cả</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> Thêm Sản Phẩm
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="loader"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Tên Sản Phẩm</th>
                <th className="px-6 py-4">Các gói (Biến thể)</th>
                <th className="px-6 py-4 text-right">Khoảng Giá Bán</th>
                <th className="px-6 py-4 text-right">Cập Nhật</th>
                <th className="px-6 py-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có sản phẩm nào trong kho.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.variants && p.variants.map((v, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs">
                            {v.duration}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                      {getPriceRange(p.variants)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-gray-400">
                      {new Date(p.lastUpdated).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onRequestDelete(p.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal (Same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg text-gray-800">
                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên Sản Phẩm</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Youtube Premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn nhập</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="Ví dụ: Kho Hà Nội"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-gray-800">Các gói biến thể (Thời hạn & Giá)</label>
                  <button 
                    type="button" 
                    onClick={handleAddVariant}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} /> Thêm biến thể
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Thời hạn</label>
                        <select
                          className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm outline-none focus:border-indigo-500"
                          value={variant.duration}
                          onChange={(e) => handleVariantChange(index, 'duration', e.target.value)}
                        >
                          {USAGE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Giá Nhập</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm outline-none focus:border-indigo-500"
                          value={variant.importPrice}
                          onChange={(e) => handleVariantChange(index, 'importPrice', e.target.value)}
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Giá Bán</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-semibold text-emerald-700 outline-none focus:border-indigo-500"
                          value={variant.sellPrice}
                          onChange={(e) => handleVariantChange(index, 'sellPrice', e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-200"
                        title="Xóa dòng này"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {formData.variants.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm italic border border-dashed rounded-lg">
                      Chưa có biến thể nào. Vui lòng thêm biến thể.
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
               <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-200"
                >
                  <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa?</h3>
              <p className="text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa sản phẩm này?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-200"
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

export default InventoryView;