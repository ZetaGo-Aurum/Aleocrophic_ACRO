'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, Timestamp, setDoc } from 'firebase/firestore';

import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/hooks/useNotification';
import { useRef } from 'react';

type Broadcast = {
  id: string;
  message: string;
  target_time: string;
  permanent: boolean;
  created_at: Date;
  linkDiscount?: boolean; // UI state only
};

export default function BroadcastManager() {
  const { user, loading } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBroadcast, setCurrentBroadcast] = useState<Partial<Broadcast>>({});
  const { permission, requestPermission, sendNotification } = useNotification();
  const notifiedIds = useRef<Set<string>>(new Set());

  // Realtime listener for broadcasts
  useEffect(() => {
    if (user?.email !== 'deltaastra24@gmail.com') return;
    
    const q = query(collection(db, 'broadcasts'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      } as Broadcast));
      setBroadcasts(list);
      setIsLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Auto-delete expired broadcasts
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      for (const broadcast of broadcasts) {
        if (!broadcast.permanent && broadcast.target_time) {
          const targetDate = new Date(broadcast.target_time);
          if (targetDate <= now) {
            // Check if we should notify first (before deleting, or just as it happens)
            // But wait, auto-delete happens immediately. 
            // If we delete, we can't notify 'expired' easily unless we catch it right before.
            // Actually, if we delete, it's gone.
            // Let's notify right before delete.
            if (!notifiedIds.current.has(broadcast.id)) {
               sendNotification('⏳ Broadcast Expired', `The broadcast "${broadcast.message}" has ended.`);
               notifiedIds.current.add(broadcast.id);
            }

            try {
              await deleteDoc(doc(db, 'broadcasts', broadcast.id));
            } catch (err) {
              console.error('Auto-delete error:', err);
            }
          }
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [broadcasts]);

  const handleSave = async () => {
    if (!currentBroadcast.message) {
      alert('Message is required');
      return;
    }

    try {
      const data = {
        message: currentBroadcast.message,
        target_time: currentBroadcast.permanent ? null : (currentBroadcast.target_time || null),
        permanent: currentBroadcast.permanent || false,
        created_at: currentBroadcast.id ? currentBroadcast.created_at : Timestamp.now()
      };

      if (currentBroadcast.id) {
        await updateDoc(doc(db, 'broadcasts', currentBroadcast.id), data);
      } else {
        await addDoc(collection(db, 'broadcasts'), data);
      }

      // Link to Global Discount if requested
      if (currentBroadcast.linkDiscount && !data.permanent && data.target_time) {
        await setDoc(doc(db, 'config', 'pricing'), {
          broadcast_target_time: data.target_time, // Update legacy field used by Global Discount
          discount_linked: true
        }, { merge: true });
        alert('Broadcast saved AND linked to Global Discount Timer! 🔗');
      } else {
        setIsEditing(false);
        setCurrentBroadcast({});
        // alert('Broadcast saved successfully');
      }
      
      if (!currentBroadcast.linkDiscount) {
         setIsEditing(false);
         setCurrentBroadcast({});
      }
    } catch (error) {
      console.error('Error saving broadcast:', error);
      alert('Failed to save broadcast');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this broadcast?')) return;
    try {
      await deleteDoc(doc(db, 'broadcasts', id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getTimeRemaining = (targetTime: string) => {
    const target = new Date(targetTime);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return 'EXPIRED';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading || isLoading) return <div className="p-8 text-white">Loading...</div>;
  if (user?.email !== 'deltaastra24@gmail.com') return <div className="p-8 text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-500">
             📢 Broadcast Manager
          </h1>
          <button 
             onClick={() => { setCurrentBroadcast({ permanent: false }); setIsEditing(true); }}
             className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-red-500 rounded hover:opacity-90 transition font-bold"
          >
             + New Broadcast
          </button>
          <div className="ml-4">
             {permission === 'default' && (
                <button onClick={requestPermission} className="bg-blue-600 px-3 py-2 rounded text-sm mr-2">Enable Notifications</button>
             )}
             <button 
               onClick={() => {
                 const sent = sendNotification('🔔 Test', 'This is a test notification!');
                 if (!sent) alert('Failed to send notification. Please Enable Alerts or check your browser settings.');
               }} 
               className="bg-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-600 transition"
             >
                Test Notify
             </button>
          </div>
        </div>

        {/* Broadcast List */}
        <div className="space-y-4">
           {broadcasts.map(broadcast => (
              <div key={broadcast.id} className={`bg-gray-800 rounded-xl p-4 border ${broadcast.permanent ? 'border-yellow-500' : 'border-gray-700'}`}>
                 <div className="flex justify-between items-start">
                    <div className="flex-1">
                       <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${broadcast.permanent ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {broadcast.permanent ? 'PERMANENT' : 'COUNTDOWN'}
                          </span>
                          {!broadcast.permanent && broadcast.target_time && (
                            <span className={`text-xs font-mono ${getTimeRemaining(broadcast.target_time) === 'EXPIRED' ? 'text-red-400' : 'text-green-400'}`}>
                              ⏳ {getTimeRemaining(broadcast.target_time)}
                            </span>
                          )}
                       </div>
                       <p className="text-white font-medium">{broadcast.message}</p>
                       {!broadcast.permanent && broadcast.target_time && (
                         <p className="text-gray-500 text-xs mt-1">Ends: {new Date(broadcast.target_time).toLocaleString()}</p>
                       )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                       <button 
                         onClick={() => { setCurrentBroadcast(broadcast); setIsEditing(true); }}
                         className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                       >
                         Edit
                       </button>
                       <button 
                         onClick={() => handleDelete(broadcast.id)}
                         className="px-3 py-1 bg-red-900/50 hover:bg-red-900 rounded text-sm text-red-400"
                       >
                         Delete
                       </button>
                    </div>
                 </div>
              </div>
           ))}
           {broadcasts.length === 0 && (
             <div className="text-center text-gray-500 py-12">
               No active broadcasts. Click "New Broadcast" to create one.
             </div>
           )}
        </div>

        {/* Edit Modal */}
        {isEditing && (
           <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700">
                 <h2 className="text-xl font-bold mb-4">{currentBroadcast.id ? 'Edit Broadcast' : 'New Broadcast'}</h2>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Message *</label>
                       <textarea 
                         value={currentBroadcast.message || ''}
                         onChange={(e) => setCurrentBroadcast({...currentBroadcast, message: e.target.value})}
                         className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-yellow-500 outline-none h-24"
                         placeholder="📢 Your broadcast message..."
                       />
                    </div>
                    
                    <div>
                       <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={currentBroadcast.permanent || false}
                            onChange={(e) => setCurrentBroadcast({...currentBroadcast, permanent: e.target.checked})}
                            className="rounded bg-gray-900 border-gray-600 text-yellow-500"
                          />
                          <span className="text-yellow-400">Permanent (No Expiry)</span>
                       </label>
                    </div>
                    
                    {!currentBroadcast.permanent && (
                      <div>
                         <label className="block text-sm text-gray-400 mb-1">End Date & Time</label>
                         <input 
                           type="datetime-local"
                           value={currentBroadcast.target_time || ''}
                           onChange={(e) => setCurrentBroadcast({...currentBroadcast, target_time: e.target.value})}
                           className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-yellow-500 outline-none"
                         />
                      </div>
                    )}

                     {!currentBroadcast.permanent && currentBroadcast.target_time && (
                        <div className="pt-2">
                           <label className="flex items-center space-x-2 cursor-pointer p-3 bg-purple-900/30 rounded border border-purple-500/30">
                              <input 
                                type="checkbox"
                                checked={currentBroadcast.linkDiscount || false}
                                onChange={(e) => setCurrentBroadcast({...currentBroadcast, linkDiscount: e.target.checked})}
                                className="rounded bg-gray-900 border-gray-600 text-purple-500"
                              />
                              <span className="text-purple-400 font-bold">🔗 Link to Global Discount Timer</span>
                           </label>
                           <p className="text-xs text-gray-500 mt-1 ml-1">
                             This will update the Global Discount countdown to match this broadcast's end time.
                           </p>
                        </div>
                     )}
                 </div>

                 <div className="flex justify-end space-x-3 mt-6">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 hover:bg-gray-700 rounded transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold transition"
                    >
                      Save Broadcast
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
