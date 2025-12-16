import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, Menu, X, LogOut, User } from 'lucide-react';
import { ViewState } from './types';
import InventoryView from './components/InventoryView';
import CustomerView from './components/CustomerView';
import OrderView from './components/OrderView';
import DashboardView from './components/DashboardView';
import LandingPage from './components/LandingPage';
import AccountView from './components/AccountView';
import { seedData, login } from './services/storage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [orderViewTab, setOrderViewTab] = useState<'list' | 'create'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const didInitRef = useRef(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    if (!didInitRef.current) {
      didInitRef.current = true;
      const init = async () => {
        await seedData();
      };
      init();
    }
  }, []);

  const handleLogin = async (password: string) => {
    const success = await login(password);
    if (success) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
    return success;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  const handleQuickCreateOrder = () => {
    setOrderViewTab('create');
    setCurrentView('orders');
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'inventory', label: 'Kho Hàng', icon: Package },
    { id: 'orders', label: 'Đơn Hàng', icon: ShoppingCart },
    { id: 'customers', label: 'Khách Hàng', icon: Users },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onCreateOrder={handleQuickCreateOrder} />;
      case 'inventory':
        return <InventoryView />;
      case 'orders':
        return <OrderView initialTab={orderViewTab} />;
      case 'customers':
        return <CustomerView />;
      case 'account':
        return <AccountView />;
      default:
        return <DashboardView onCreateOrder={handleQuickCreateOrder} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="bg-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center text-white">H</span>
            HORDER
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'orders') {
                    setOrderViewTab('list');
                  }
                  setCurrentView(item.id as ViewState);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}

          <hr className="border-slate-800 my-4" />

          <button
            onClick={() => {
              setCurrentView('account');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'account'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <User size={20} />
            Tài khoản
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:bg-slate-800 hover:text-red-300"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800 text-xs text-slate-500">
          &copy; 2024 HORDER App
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;