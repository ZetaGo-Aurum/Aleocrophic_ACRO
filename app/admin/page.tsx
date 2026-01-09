'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

type PricingConfig = {
  proplus_price: number;
  ultimate_price: number;
  discount_active: boolean;
  discount_percent: number;
  discount_tiers: string[];
  broadcast_active?: boolean;
  broadcast_message?: string;
  broadcast_duration?: number;
  broadcast_permanent?: boolean;
  broadcast_target_time?: string; // ISO String for Countdown
  broadcast_auto_expire?: boolean;
  discount_linked?: boolean;
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
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  // Fetch Pricing Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as PricingConfig);
      } else {
        // Initialize if not exists
        const initialConfig = {
          proplus_price: 25,   // PRO+ = 25 ACRON = Rp 75,000
          ultimate_price: 50,  // ULTIMATE = 50 ACRON = Rp 150,000
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
      setStats({
          totalUsers: userList.length,
          totalRevenue: 0, // Placeholder
          totalLicenses: 0 // Placeholder
      });
    });

    return () => unsubUsers();
  }, []);

  // Clean config before saving (remove undefined values, replace with null or delete)
  const cleanConfigForSave = (cfg: PricingConfig): Record<string, any> => {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(cfg)) {
      if (value !== undefined) {
        cleaned[key] = value;
      } else {
        cleaned[key] = null; // Firebase accepts null, not undefined
      }
    }
    return cleaned;
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const cleanedConfig = cleanConfigForSave(config);
      await setDoc(doc(db, 'config', 'pricing'), cleanedConfig);
      alert('Pricing configuration updated successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save config.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!editingUser || newBalance === '') return;
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        acronBalance: parseFloat(newBalance)
      });
      setEditingUser(null);
      setNewBalance('');
      alert(`Updated balance for ${editingUser.displayName}`);
    } catch (error) {
       console.error('Error updating balance:', error);
       alert('Failed to update balance');
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
                 type="text" 
                 inputMode="decimal"
                 value={config?.proplus_price?.toString() ?? ''} 
                 onChange={(e) => {
                   const val = e.target.value;
                   if (val === '' || /^\d*\.?\d*$/.test(val)) {
                     setConfig(prev => prev ? {...prev, proplus_price: val === '' ? 0 : parseFloat(val)} : null);
                   }
                 }}
                 className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-teal-500 outline-none"
                 placeholder="0"
               />
             </div>
             <div>
               <label className="block text-sm text-gray-400 mb-1">ULTIMATE Price</label>
               <input 
                 type="text"
                 inputMode="decimal" 
                 value={config?.ultimate_price?.toString() ?? ''} 
                 onChange={(e) => {
                   const val = e.target.value;
                   if (val === '' || /^\d*\.?\d*$/.test(val)) {
                     setConfig(prev => prev ? {...prev, ultimate_price: val === '' ? 0 : parseFloat(val)} : null);
                   }
                 }}
                 className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-teal-500 outline-none"
                 placeholder="0"
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
                   checked={config?.discount_active ?? false}
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
                     type="text" 
                     max="100" min="0"
                     value={config?.discount_percent?.toString() || ''}
                     onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                             setConfig(prev => prev ? {...prev, discount_percent: 0} : null);
                        } else if (/^\d+$/.test(val)) {
                             setConfig(prev => prev ? {...prev, discount_percent: Number(val)} : null);
                        }
                     }}
                     className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-teal-500 outline-none"
                     placeholder="0"
                   />
                   {/* Unit Price Calculation Display */}
                   <div className="mt-2 text-xs text-gray-400 bg-gray-900 p-2 rounded border border-gray-700">
                      <div className="flex justify-between">
                         <span>Unit Price (Normal):</span>
                         <span>Rp 62.500</span>
                      </div>
                      <div className="flex justify-between font-bold text-teal-400">
                         <span>Unit Price (Discounted):</span>
                         <span>Rp {(62500 * ((100 - (config?.discount_percent || 0)) / 100)).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="mt-1 pt-1 border-t border-gray-700 text-yellow-500">
                         * User pays full ACRON, but buys ACRON cheaper at Trakteer.
                      </div>
                   </div>
                </div>
                <div>
                   <label className="block text-sm text-gray-400 mb-1">Applicable Tiers</label>
                   <div className="flex space-x-4">
                     <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          checked={config?.discount_tiers.includes('proplus') ?? false}
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
                          checked={config?.discount_tiers.includes('ultimate') ?? false}
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
                   
                   {/* Discount Linkage */}
                   <div className="mt-4 pt-4 border-t border-gray-700">
                      <label className="flex items-center space-x-2 cursor-pointer">
                         <input 
                           type="checkbox"
                           checked={config?.discount_linked ?? false}
                           onChange={(e) => setConfig(prev => prev ? {...prev, discount_linked: e.target.checked} : null)}
                           className="form-checkbox text-purple-500 rounded bg-gray-900 border-gray-600"
                         />
                         <span className="text-sm text-purple-400">Link Discount to Broadcast Countdown 🔗</span>
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
                    <td className="p-3">
                       <div className="flex items-center space-x-2">
                          <span className="text-yellow-400 font-bold">{user.acronBalance} ACRON</span>
                          <button 
                             onClick={() => { setEditingUser(user); setNewBalance(user.acronBalance.toString()); }}
                             className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-teal-400"
                          >
                            Edit
                          </button>
                       </div>
                    </td>
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
      
      {/* Edit Balance Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
           <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-4">Edit Balance: {editingUser.displayName}</h3>
              <div className="mb-4">
                 <label className="block text-sm text-gray-400 mb-1">New Balance (ACRON)</label>
                 <input 
                   type="text"
                   inputMode="decimal"
                   value={newBalance}
                   onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) setNewBalance(val);
                   }}
                   className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-teal-500"
                 />
              </div>
              <div className="flex justify-end space-x-3">
                 <button 
                   onClick={() => setEditingUser(null)}
                   className="px-4 py-2 hover:bg-gray-700 rounded transition"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleUpdateBalance}
                   className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded font-bold transition"
                 >
                   Update
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
