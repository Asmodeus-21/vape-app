import { Bell, Edit3, Package, Shield, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { fetchCurrentUser } from '../services/api';

interface AuthUser {
    id: number;
    email: string;
    name: string;
    role: string;
    age_verified: boolean;
    verification_status: string;
}

interface Order {
    id: number;
    status: string;
    total_amount: number;
    created_at: string;
    shipping_address: string;
}

export default function UserProfile() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'settings'>('overview');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const token = localStorage.getItem('vapeshub_token');
            if (!token) return;

            const userData = await fetchCurrentUser(token);
            setUser(userData);

            // Load user orders (would need API endpoint)
            // const userOrders = await fetchUserOrders(token);
            // setOrders(userOrders);

        } catch (err) {
            console.error('Failed to load user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('vapeshub_token');
        window.location.reload();
        toast.success('Signed out successfully');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Loading profile...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Please sign in to view your profile</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <p className="text-slate-400">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${user.verification_status === 'verified'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {user.verification_status}
                                </span>
                                <span className="px-2 py-1 bg-slate-700 rounded text-xs">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-6xl mx-auto px-4">
                    <nav className="flex gap-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: UserIcon },
                            { id: 'orders', label: 'Orders', icon: Package },
                            { id: 'settings', label: 'Settings', icon: Shield }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-slate-400 hover:text-white'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {/* Account Status */}
                        <div className="bg-slate-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-brand-primary" />
                                <h3 className="text-lg font-semibold">Account Status</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Age Verified</span>
                                    <span className={user.age_verified ? 'text-green-400' : 'text-yellow-400'}>
                                        {user.age_verified ? 'Yes' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Verification</span>
                                    <span className={user.verification_status === 'verified' ? 'text-green-400' : 'text-yellow-400'}>
                                        {user.verification_status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-slate-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Package className="w-6 h-6 text-brand-primary" />
                                <h3 className="text-lg font-semibold">Recent Orders</h3>
                            </div>
                            <p className="text-slate-400 text-sm">
                                {orders.length > 0 ? `${orders.length} orders` : 'No orders yet'}
                            </p>
                        </div>

                        {/* Account Actions */}
                        <div className="bg-slate-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Edit3 className="w-6 h-6 text-brand-primary" />
                                <h3 className="text-lg font-semibold">Quick Actions</h3>
                            </div>
                            <div className="space-y-2">
                                <button className="w-full text-left px-3 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                                    Update Profile
                                </button>
                                <button className="w-full text-left px-3 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                                    Change Password
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left px-3 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800 rounded-lg p-6"
                    >
                        <h3 className="text-xl font-semibold mb-6">Order History</h3>
                        {orders.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No orders yet</p>
                                <p className="text-sm text-slate-500 mt-2">Your order history will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="border border-slate-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium">Order #{order.id}</span>
                                            <span className={`px-2 py-1 rounded text-xs ${order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                                    order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-400 space-y-1">
                                            <p>Total: ${order.total_amount.toFixed(2)}</p>
                                            <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800 rounded-lg p-6"
                    >
                        <h3 className="text-xl font-semibold mb-6">Account Settings</h3>
                        <div className="space-y-6">
                            {/* Notifications */}
                            <div>
                                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Notifications
                                </h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="rounded" defaultChecked />
                                        <span>Order updates</span>
                                    </label>
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="rounded" defaultChecked />
                                        <span>Promotional emails</span>
                                    </label>
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="rounded" />
                                        <span>New product alerts</span>
                                    </label>
                                </div>
                            </div>

                            {/* Privacy */}
                            <div>
                                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Privacy
                                </h4>
                                <div className="space-y-3">
                                    <button className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                                        Download My Data
                                    </button>
                                    <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors ml-4">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}