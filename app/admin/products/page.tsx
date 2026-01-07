'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  fileUrl?: string;
  layout?: 'grid' | 'list';
  highlight?: boolean;
};

export default function ProductManager() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

  useEffect(() => {
    if (user?.email !== 'deltaastra24@gmail.com') return;
    
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('name'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(list);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  const handleSave = async () => {
    if (!currentProduct.name || !currentProduct.price) return;

    try {
      if (currentProduct.id) {
        // Update
        await updateDoc(doc(db, 'products', currentProduct.id), {
          ...currentProduct,
          price: Number(currentProduct.price)
        });
      } else {
        // Create
        await addDoc(collection(db, 'products'), {
          ...currentProduct,
          price: Number(currentProduct.price),
          layout: currentProduct.layout || 'grid',
          highlight: currentProduct.highlight || false
        });
      }
      setIsEditing(false);
      setCurrentProduct({});
      // Refresh
      const q = query(collection(db, 'products'), orderBy('name'));
      const snapshot = await getDocs(q);
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  if (loading || isLoading) return <div className="p-8 text-white">Loading...</div>;
  if (user?.email !== 'deltaastra24@gmail.com') return <div className="p-8 text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
             📦 Product Manager
          </h1>
          <button 
             onClick={() => { setCurrentProduct({}); setIsEditing(true); }}
             className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded hover:opacity-90 transition font-bold"
          >
             + Add Product
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {products.map(product => (
              <div key={product.id} className={`bg-gray-800 rounded-xl p-4 border ${product.highlight ? 'border-yellow-500' : 'border-gray-700'}`}>
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <span className="text-yellow-400 font-mono">{product.price} ACRON</span>
                 </div>
                 <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                 <div className="flex space-x-2">
                    <button 
                      onClick={() => { setCurrentProduct(product); setIsEditing(true); }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 bg-red-900/50 hover:bg-red-900 py-1 rounded text-sm text-red-400"
                    >
                      Delete
                    </button>
                 </div>
              </div>
           ))}
           {products.length === 0 && <p className="text-gray-500 col-span-3 text-center">No products found.</p>}
        </div>

        {/* Edit Modal */}
        {isEditing && (
           <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700">
                 <h2 className="text-xl font-bold mb-4">{currentProduct.id ? 'Edit Product' : 'New Product'}</h2>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                       <input 
                         type="text"
                         value={currentProduct.name || ''}
                         onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                         className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                         placeholder="e.g. Premium Script v4"
                       />
                    </div>
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Description</label>
                       <textarea 
                         value={currentProduct.description || ''}
                         onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                         className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none h-24"
                         placeholder="Product details..."
                       />
                    </div>
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Price (ACRON)</label>
                       <input 
                         type="number"
                         value={currentProduct.price || 0}
                         onChange={(e) => setCurrentProduct({...currentProduct, price: Number(e.target.value)})}
                         className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                       />
                    </div>
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Image URL (Optional)</label>
                       <input 
                         type="text"
                         value={currentProduct.imageUrl || ''}
                         onChange={(e) => setCurrentProduct({...currentProduct, imageUrl: e.target.value})}
                         className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                         placeholder="https://..."
                       />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">File URL / Download Link</label>
                        <input 
                          type="text"
                          value={currentProduct.fileUrl || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct, fileUrl: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                          placeholder="Google Drive, Mega, or Direct Link"
                        />
                     </div>
                     <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm">
                           <input 
                             type="checkbox"
                             checked={currentProduct.highlight || false}
                             onChange={(e) => setCurrentProduct({...currentProduct, highlight: e.target.checked})}
                             className="rounded bg-gray-900 border-gray-600 text-yellow-500"
                           />
                           <span className="text-yellow-400">Highlight (Golden Border)</span>
                        </label>
                     </div>
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
                      className="px-6 py-2 bg-teal-600 hover:bg-teal-500 rounded font-bold transition"
                    >
                      Save Product
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
