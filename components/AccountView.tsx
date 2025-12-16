import React, { useState, useEffect } from 'react';
import { User, Lock, Save, AlertCircle } from 'lucide-react';
import { getProfile, updateProfile, changePassword } from '../services/storage';

const AccountView: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState<{ username: string; fullName: string }>({ username: '', fullName: '' });
    const [tempFullName, setTempFullName] = useState('');

    // Password State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getProfile();
            if (data) {
                setUserInfo({ username: data.username, fullName: data.fullName || '' });
                setTempFullName(data.fullName || '');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await updateProfile(tempFullName);
        if (success) {
            setMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
            loadProfile();
        } else {
            setMsg({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật.' });
        }
        setLoading(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
            return;
        }
        setLoading(true);
        const res = await changePassword(oldPassword, newPassword);
        if (res.success) {
            setMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setMsg({ type: 'error', text: res.message || 'Đổi mật khẩu thất bại' });
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="text-indigo-600" /> Quản lý tài khoản
                </h2>
                <p className="text-gray-500 text-sm mt-1">Cập nhật thông tin cá nhân và bảo mật.</p>
            </div>

            {/* Message Alert */}
            {msg.text && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <AlertCircle size={18} />
                    {msg.text}
                </div>
            )}

            {/* Profile Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Thông tin chung</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
                            <input
                                type="text"
                                value={userInfo.username}
                                disabled
                                className="w-full bg-gray-100 text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tên hiển thị</label>
                            <input
                                type="text"
                                value={tempFullName}
                                onChange={(e) => setTempFullName(e.target.value)}
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Nhập tên hiển thị"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 transition"
                        >
                            <Save size={18} /> Lưu thông tin
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <Lock size={18} className="text-gray-500" /> Đổi mật khẩu
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !oldPassword || !newPassword}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Lock size={18} /> Đổi mật khẩu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountView;
