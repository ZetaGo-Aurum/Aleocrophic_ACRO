'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

type PricingConfig = {
  proplus_price: number;
  ultimate_price: number;
  discount_active: boolean;
  discount_percent: number;
  discount_tiers: string[];
};

type UserData = {
  uid: string;
  email: string;
  displayName: string;
  acronBalance: number;
  tier: string;
  lastPurchase: string;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // State
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalRevenue: 0, totalLicenses: 0 });
  const [saving, setSaving] = useState(false);

  // Fetch Pricing Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as PricingConfig);
      } else {
        // Initialize if not exists
        const initialConfig = {
          proplus_price: 1,
          ultimate_price: 2,
          discount_active: false,
          discount_percent: 0,
          discount_tiers: []
        };
        setConfig(initialConfig);
        // We don't save automatically here to avoid write loops, user must save manually first time
      }
      setLoadingConfig(false);
    });
    return () => unsub();
  }, []);

  // Fetch Users & Stats (Realtime)
  useEffect(() => {
    // Only fetch recent users for table
    const q = query(collection(db, 'users'), orderBy('lastPurchase', 'desc'), limit(50));
    
    const unsubUsers = onSnapshot(q, (snapshot) => {
      const userList: UserData[] = [];
      let revenue = 0;
      let licenses = 0;

      // Note: For total revenue we would need an aggregation query or cloud function.
      // Here we approximate with loaded users or just show "Recent Revenue".
      // For accurate stats, better use Server Side aggregation. 
      // User requested "Sales Overview".
      // We will perform a basic client-side calc on visible users for now.
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        userList.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName || 'Unknown',
          acronBalance: data.acronBalance || 0,
          tier: data.tier || 'Free',
          lastPurchase: data.lastPurchase
        } as UserData);
      });
      setUsers(userList);
    });

    return () => unsubUsers();
  }, []);

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'pricing'), config);
      alert('Pricing configuration updated successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save config.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingConfig) return <div>Loading Configuration...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
          Admin Dashboard
        </h2>
        <p className="text-gray-400">Welcome, Owner ({user?.email})</p>
      </header>

      {/* Pricing Management Card */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-white flex items-center">
          <span className="bg-teal-500 w-2 h-8 rounded mr-3"></span>
          Pricing & Promotions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Prices */}
          <div className="space-y-4">
             <h4 className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Base Price (ACRON)</h4>
             <div>
               <label className="block text-sm text-gray-400 mb-1">PRO+ Price</label>
               <input 
                 type="number" 
                 value={config?.proplus_price} 
                 onChange={(e) => setConfig(prev => prev ? {...prev, proplus_price: Number(e.target.value)} : null)}
                 className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-teal-500 outline-none"
               />
             </div>
             <div>
               <label className="block text-sm text-gray-400 mb-1">ULTIMATE Price</label>
               <input 
                 type="number" 
                 value={config?.ultimate_price} 
                 onChange={(e) => setConfig(prev => prev ? {...prev, ultimate_price: Number(e.target.value)} : null)}
                 className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-teal-500 outline-none"
               />
             </div>
          </div>

          {/* Discounts */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <h4 className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Promotion / Discount</h4>
               <label className="flex items-center space-x-2 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={config?.discount_active}
                   onChange={(e) => setConfig(prev => prev ? {...prev, discount_active: e.target.checked} : null)}
                   className="form-checkbox h-5 w-5 text-teal-500 rounded bg-gray-900 border-gray-600"
                 />
                 <span className={config?.discount_active ? "text-teal-400 font-bold" : "text-gray-500"}>
                   {config?.discount_active ? 'ACTIVE' : 'INACTIVE'}
                 </span>
               </label>
             </div>
             
             <div className={`space-y-4 transition-opacity ${config?.discount_active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div>
                   <label className="block text-sm text-gray-400 mb-1">Discount Percentage (%)</label>
                   <input 
                     type="number" 
                     max="100" min="0"
                     value={config?.discount_percent}
                     onChange={(e) => setConfig(prev => prev ? {...prev, discount_percent: Number(e.target.value)} : null)}
                     className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-teal-500 outline-none"
                   />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Applicable Tiers</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                       <input 
                         type="checkbox"
                         checked={config?.discount_tiers.includes('proplus')}
                         onChange={(e) => {
                            if (!config) return;
                            const tiers = e.target.checked 
                              ? [...config.discount_tiers, 'proplus']
                              : config.discount_tiers.filter(t => t !== 'proplus');
                            setConfig({...config, discount_tiers: tiers});
                         }}
                         className="rounded bg-gray-900 border-gray-600 text-teal-500"
                       />
                       <span>PRO+</span>
                    </label>
                    <label className="flex items-center space-x-2">
                       <input 
                         type="checkbox"
                         checked={config?.discount_tiers.includes('ultimate')}
                         onChange={(e) => {
                            if (!config) return;
                            const tiers = e.target.checked 
                              ? [...config.discount_tiers, 'ultimate']
                              : config.discount_tiers.filter(t => t !== 'ultimate');
                            setConfig({...config, discount_tiers: tiers});
                         }}
                         className="rounded bg-gray-900 border-gray-600 text-teal-500"
                       />
                       <span>ULTIMATE</span>
                    </label>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold rounded shadow transition transform hover:scale-105 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg overflow-hidden">
        <h3 className="text-xl font-bold mb-4 text-white flex items-center">
          <span className="bg-purple-500 w-2 h-8 rounded mr-3"></span>
          Recent Customers
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase">
                 <th className="p-3">User</th>
                 <th className="p-3">Email</th>
                 <th className="p-3">Balance</th>
                 <th className="p-3">Tier</th>
                 <th className="p-3">Last Purchase</th>
               </tr>
             </thead>
             <tbody className="text-sm">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-750 transition border-b border-gray-700/50">
                    <td className="p-3 font-medium text-white">{user.displayName}</td>
                    <td className="p-3 text-gray-300">{user.email}</td>
                    <td className="p-3 text-yellow-400 font-bold">{user.acronBalance} ACRON</td>
                    <td className="p-3">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                         user.tier === 'ultimate' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' :
                         user.tier === 'proplus' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                         'bg-gray-600 text-white'
                       }`}>
                         {user.tier}
                       </span>
                    </td>
                    <td className="p-3 text-gray-400">
                      {user.lastPurchase ? new Date(user.lastPurchase).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
