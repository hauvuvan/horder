import React, { useState } from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';

interface LandingPageProps {
    onLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await onLogin(password);
            if (!result.success) {
                setError(result.message || 'Mật khẩu hoặc tên đăng nhập không đúng!');
            }
        } catch (err) {
            setError('Đã có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-black flex flex-col justify-center items-center text-white p-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">

                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-500 p-4 rounded-full shadow-lg shadow-indigo-500/50">
                        <ShieldCheck size={48} className="text-white" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2 tracking-wide">
                    HORDER
                </h1>
                <p className="text-center text-indigo-200 mb-8 text-sm uppercase">
                    Ứng dụng quản lý đơn hàng
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-indigo-300 uppercase mb-1 ml-1">Tài khoản</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="Nhập tài khoản"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-indigo-300 uppercase mb-1 ml-1">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-100 text-sm px-4 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-900/20 transition transform active:scale-95 flex justify-center items-center gap-2"
                    >
                        {loading ? <div className="loader w-5 h-5 border-2 border-white/30 border-t-white"></div> : <><LogIn size={20} /> Đăng nhập</>}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-500">
                    &copy; 2024 HORDER. Security Access.
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
