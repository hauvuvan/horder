import { Product, Customer, Order, generateId } from '../types';

const API_URL = '/api';

// --- API HELPER FUNCTIONS ---

const api = {
  get: async (endpoint: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(data),
      });
      // if (!response.ok) throw new Error(`API Error: ${response.statusText}`); 
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Invalid JSON response:', text);
        // If it's a Vercel error page, it usually starts with "A server error..." or HTML
        const errorMsg = text.length < 100 ? text : `Server Error (${response.status}): Invalid Response Format`;
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },

  put: async (endpoint: string, data: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
};

export const login = async (password: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post('/login', { username: 'admin', password });
    if (res.success && res.token) {
      localStorage.setItem('authToken', res.token);
      return { success: true };
    }
    return { success: false, message: res.message || 'Đăng nhập thất bại' };
  } catch (error) {
    return { success: false, message: (error as Error).message || 'Lỗi kết nối server' };
  }
};

export const getProfile = async () => {
  return await api.get('/profile');
};

export const updateProfile = async (fullName: string) => {
  const res = await api.put('/profile', { fullName });
  return res.success;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  try {
    const res = await api.put('/password', { oldPassword, newPassword });
    return res;
  } catch (e) {
    return { success: false, message: 'Lỗi kết nối' };
  }
};

// --- EXPORTED SERVICE FUNCTIONS (API) ---

// --- PRODUCTS ---
export const getProducts = async (): Promise<Product[]> => {
  return await api.get('/products');
};

export const saveProduct = async (product: Product) => {
  // Check if exists logic typically handled by backend or ID check
  // For simplicity, we can try creating. If ID exists, backend should likely update or reject.
  // Since we don't have a direct 'upsert' endpoint in the simple route, we might assume new for now
  // or use a specific implementation.
  // HOWEVER, for this specific migration where we might be seeding:
  // Let's assume we post. Real app might check existence first.
  await api.post('/products', product);
};

export const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`);
};

// --- CUSTOMERS ---
export const getCustomers = async (): Promise<Customer[]> => {
  return await api.get('/customers');
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
  // Check duplicate phone is now handled by backend or we can do a quick check here if we want to avoid call
  // For robustness, let backend handle it or check via GET.
  // The simple backend we wrote just creates. Let's do a client-side check to match previous logic logic
  const customers = await getCustomers();
  const existing = customers.find(c => c.phone === customerData.phone);
  if (existing) return existing;

  const newCustomer = {
    ...customerData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return await api.post('/customers', newCustomer);
};

// --- ORDERS ---
export const getOrders = async (): Promise<Order[]> => {
  // Backend sorts by createdAt desc already
  return await api.get('/orders');
};

export const createOrder = async (
  customerId: string,
  customerName: string,
  customerPhone: string,
  items: any[],
  notes?: string
): Promise<Order> => {
  const totalAmount = items.reduce((sum, item) => sum + item.priceAtSale, 0);

  const newOrder = {
    id: generateId(), // Client gen ID or Server gen ID? Server schema has ID required. Let's generate here.
    customerId,
    customerName,
    customerPhone,
    items,
    totalAmount,
    status: 'completed',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  return await api.post('/orders', newOrder);
};

// Update existing order (used for cancellations/refunds)
export const updateOrder = async (order: Order): Promise<void> => {
  await api.put(`/orders/${order.id}`, order);
};

// Hard delete order
export const deleteOrder = async (id: string): Promise<void> => {
  await api.delete(`/orders/${id}`);
};

// --- BACKUP / RESTORE ---
// --- BACKUP / RESTORE ---
export const backupData = async () => {
  try {
    const data = await api.get('/backup');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `horder-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Backup thất bại: " + (e as Error).message);
  }
};

export const restoreData = (file: File, callback: (success: boolean, message?: string) => void) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target?.result as string);
      const res = await api.post('/restore', json);
      if (res.success) {
        callback(true);
      } else {
        callback(false, res.message);
      }
    } catch (err) {
      callback(false, (err as Error).message);
    }
  };
  reader.readAsText(file);
};

// --- SEED DATA ---
export const seedData = async () => {
  try {
    const existing = await getProducts();
    if (existing.length === 0) {
      const products: Product[] = [
        {
          id: '1',
          name: 'Youtube Premium',
          source: 'Family Share',
          lastUpdated: new Date().toISOString(),
          variants: [
            { id: 'v1', duration: '1 tháng', importPrice: 25000, sellPrice: 40000 },
            { id: 'v2', duration: '6 tháng', importPrice: 140000, sellPrice: 220000 },
            { id: 'v3', duration: '1 năm', importPrice: 250000, sellPrice: 390000 },
          ]
        },
        {
          id: '2',
          name: 'Netflix 4K',
          source: 'Giftcode US',
          lastUpdated: new Date().toISOString(),
          variants: [
            { id: 'v4', duration: '1 tháng', importPrice: 60000, sellPrice: 85000 },
          ]
        },
      ];

      for (const p of products) {
        await saveProduct(p);
      }
      console.log('Data seeded via API');
    }
  } catch (err) {
    console.error("Error Seeding Data:", err);
  }
};

export const isCloudEnabled = () => true; // Now connected to backend