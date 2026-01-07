'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/lib/auth-context';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For strikethrough
  imageUrl?: string;
  fileUrl?: string;
  layout: 'grid' | 'list' | 'featured';
  highlight?: boolean;
  applyGlobalDiscount?: boolean;
};

type PricingConfig = {
  discount_active: boolean;
  discount_percent: number;
};

export default function ProductManager() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch Pricing Config for discount info
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setPricingConfig(docSnap.data() as PricingConfig);
      }
    });
    return () => unsub();
  }, []);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        alert("Upload failed!");
        setUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setCurrentProduct(prev => ({ ...prev, imageUrl: downloadURL }));
          setUploading(false);
        });
      }
    );
  };

  const handleSave = async () => {
    if (!currentProduct.name || currentProduct.price === undefined) {
      alert("Please fill in Product Name and Price!");
      return;
    }

    try {
      const productData = {
        name: currentProduct.name,
        description: currentProduct.description || '',
        price: Number(currentProduct.price),
        originalPrice: currentProduct.originalPrice ? Number(currentProduct.originalPrice) : null,
        imageUrl: currentProduct.imageUrl || '',
        fileUrl: currentProduct.fileUrl || '',
        layout: currentProduct.layout || 'grid',
        highlight: currentProduct.highlight || false,
        applyGlobalDiscount: currentProduct.applyGlobalDiscount || false
      };

      if (currentProduct.id) {
        await updateDoc(doc(db, 'products', currentProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
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

  const getDisplayPrice = (product: Product) => {
    if (product.applyGlobalDiscount && pricingConfig?.discount_active && pricingConfig.discount_percent > 0) {
      const discounted = product.price * ((100 - pricingConfig.discount_percent) / 100);
      return { price: discounted.toFixed(1), original: product.price, hasDiscount: true, percent: pricingConfig.discount_percent };
    }
    if (product.originalPrice && product.originalPrice > product.price) {
      const percent = Math.round((1 - product.price / product.originalPrice) * 100);
      return { price: product.price, original: product.originalPrice, hasDiscount: true, percent };
    }
    return { price: product.price, original: null, hasDiscount: false, percent: 0 };
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
             onClick={() => { setCurrentProduct({ layout: 'grid' }); setIsEditing(true); }}
             className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded hover:opacity-90 transition font-bold"
          >
             + Add Product
          </button>
        </div>

        {/* Discount Status Banner */}
        {pricingConfig?.discount_active && (
          <div className="mb-6 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg text-yellow-300 text-sm">
            🎉 Global Discount Active: <strong>{pricingConfig.discount_percent}% OFF</strong> — Products with "Apply Global Discount" will show this discount.
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {products.map(product => {
             const priceInfo = getDisplayPrice(product);
             return (
               <div key={product.id} className={`relative bg-gray-800 rounded-xl p-4 border ${product.highlight ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg' : 'border-gray-700'}`}>
                  {/* Discount Ribbon */}
                  {priceInfo.hasDiscount && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      -{priceInfo.percent}%
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                     <div>
                       <span className="text-xs text-gray-500 uppercase">{product.layout}</span>
                       <h3 className="font-bold text-lg">{product.name}</h3>
                     </div>
                     <div className="text-right">
                       {priceInfo.hasDiscount && (
                         <span className="text-gray-500 line-through text-sm block">{priceInfo.original} ACRON</span>
                       )}
                       <span className={`font-mono font-bold ${priceInfo.hasDiscount ? 'text-green-400' : 'text-yellow-400'}`}>
                         {priceInfo.price} ACRON
                       </span>
                     </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  {product.applyGlobalDiscount && (
                    <div className="text-xs text-purple-400 mb-2">🔗 Uses Global Discount</div>
                  )}
                  
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
             );
           })}
           {products.length === 0 && <p className="text-gray-500 col-span-3 text-center">No products found.</p>}
        </div>

        {/* Edit Modal */}
        {isEditing && (
           <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
                 <h2 className="text-xl font-bold mb-4">{currentProduct.id ? 'Edit Product' : 'New Product'}</h2>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Product Name *</label>
                       <input 
                         type="text"
                         value={currentProduct.name || ''}
                         onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                         className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                         placeholder="e.g. Premium Script v4"
                       />
                    </div>
                    
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Layout Preset</label>
                       <select
                         value={currentProduct.layout || 'grid'}
                         onChange={(e) => setCurrentProduct({...currentProduct, layout: e.target.value as 'grid' | 'list' | 'featured'})}
                         className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                       >
                         <option value="grid">Grid (Standard)</option>
                         <option value="list">List (Compact)</option>
                         <option value="featured">Featured (Large)</option>
                       </select>
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
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm text-gray-400 mb-1">Price (ACRON) *</label>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={currentProduct.price?.toString() ?? ''}
                            onChange={(e) => {
                               const val = e.target.value;
                               if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  setCurrentProduct({...currentProduct, price: val === '' ? 0 : Number(val)});
                               }
                            }}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                            placeholder="0"
                          />
                       </div>
                       <div>
                          <label className="block text-sm text-gray-400 mb-1">Original Price (Optional)</label>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={currentProduct.originalPrice?.toString() ?? ''}
                            onChange={(e) => {
                               const val = e.target.value;
                               if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  setCurrentProduct({...currentProduct, originalPrice: val === '' ? undefined : Number(val)});
                               }
                            }}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                            placeholder="For strikethrough"
                          />
                       </div>
                    </div>
                    
                    <div>
                       <label className="block text-sm text-gray-400 mb-1">Image URL (Upload or Paste)</label>
                       <div className="flex space-x-2">
                          <input 
                            type="text"
                            value={currentProduct.imageUrl || ''}
                            onChange={(e) => setCurrentProduct({...currentProduct, imageUrl: e.target.value})}
                            className="flex-1 bg-gray-900 border border-gray-600 rounded p-2 focus:border-teal-500 outline-none"
                            placeholder="https://..."
                          />
                          <label className="cursor-pointer bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded flex items-center justify-center">
                             <span>{uploading ? `${Math.round(uploadProgress)}%` : 'Upload'}</span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                          </label>
                       </div>
                       {currentProduct.imageUrl && (
                          <img src={currentProduct.imageUrl} alt="Preview" className="mt-2 h-20 w-auto rounded border border-gray-700 object-cover" />
                       )}
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
                     
                     <div className="space-y-2 pt-2 border-t border-gray-700">
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                           <input 
                             type="checkbox"
                             checked={currentProduct.highlight || false}
                             onChange={(e) => setCurrentProduct({...currentProduct, highlight: e.target.checked})}
                             className="rounded bg-gray-900 border-gray-600 text-yellow-500"
                           />
                           <span className="text-yellow-400">⭐ Highlight (Golden Border)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                           <input 
                             type="checkbox"
                             checked={currentProduct.applyGlobalDiscount || false}
                             onChange={(e) => setCurrentProduct({...currentProduct, applyGlobalDiscount: e.target.checked})}
                             className="rounded bg-gray-900 border-gray-600 text-purple-500"
                           />
                           <span className="text-purple-400">🔗 Apply Global Discount (from Pricing Config)</span>
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
