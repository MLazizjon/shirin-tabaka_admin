import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./Products.css";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUpload
} from "react-icons/fi";

import { supabase } from "../../supabase/supabase";

export default function Products({ selectedCategory }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal oynalar holati
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form input state'lari
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState("active");
  const [uploading, setUploading] = useState(false);

  // Mahsulotlar va kategoriyalarni olish
  const fetchProductsAndCategories = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    const { data: prodData, error: prodError } = await query;
    if (prodError) {
      console.error("Mahsulotlarni olishda xatolik:", prodError);
    } else {
      setProducts(prodData || []);
    }

    // Kategoriyalarni select uchun olish
    const { data: catData, error: catError } = await supabase.from('categories').select('*');
    if (!catError) {
      setCategories(catData || []);
    }

    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Add modalini ochish
  const handleOpenAdd = () => {
    setNameUz("");
    setNameRu("");
    setNameEn("");
    setPrice("");
    setCategoryId(selectedCategory || (categories[0]?.id ?? ""));
    setImage("");
    setStatus("active");
    setIsAddModalOpen(true);
  };

  // Yangi mahsulot qo'shish
  const handleCreateProduct = async (e) => {
    e.preventDefault();

    const slug = nameEn ? nameEn.toLowerCase().replace(/\s+/g, '-') : 'product';
    const generatedId = `${slug}-${Date.now()}`;

    const { error } = await supabase
      .from('products')
      .insert([
        {
          id: generatedId,
          name: { uz: nameUz, ru: nameRu, en: nameEn },
          price: Number(price),
          category_id: categoryId,
          image_url: image,
          status: status,
        }
      ]);

    if (error) {
      console.error("Qo'shishda xatolik:", error);
      alert(`Xatolik: ${error.message}`);
    } else {
      setIsAddModalOpen(false);
      fetchProductsAndCategories();
    }
  };

  // Edit modalini ochish
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setNameUz(typeof product.name === 'object' ? product.name?.uz : product.name || "");
    setNameRu(typeof product.name === 'object' ? product.name?.ru : "");
    setNameEn(typeof product.name === 'object' ? product.name?.en : "");
    setPrice(product.price || "");
    setCategoryId(product.category_id || "");
    setImage(product.image_url || product.image || "");
    setStatus(product.status || "active");
    setIsEditModalOpen(true);
  };

  // Mahsulotni yangilash
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const { error } = await supabase
      .from('products')
      .update({
        name: { uz: nameUz, ru: nameRu, en: nameEn },
        price: Number(price),
        category_id: categoryId,
        image_url: image,
        status: status,
      })
      .eq('id', editingProduct.id);

    if (error) {
      console.error("Yangilashda xatolik:", error);
      alert(`Xatolik: ${error.message}`);
    } else {
      setIsEditModalOpen(false);
      fetchProductsAndCategories();
    }
  };

  // O'chirish
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Haqiqatan ham bu mahsulotni o'chirmoqchimisiz?")) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("O'chirishda xatolik:", error);
      alert("O'chirishda xatolik yuz berdi!");
    } else {
      fetchProductsAndCategories();
    }
  };

  // Kompyuterdan rasm yuklash ('categories' bucketiga to'g'rilandi)
  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('categories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('categories')
        .getPublicUrl(filePath);

      setImage(data.publicUrl);
    } catch (error) {
      console.error("Rasm yuklashda xatolik:", error);
      alert("Rasmni yuklab bo'lmadi!");
    } finally {
      setUploading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const productName = typeof item.name === 'object' 
        ? item.name?.uz || '' 
        : item.name;

      return productName
        .toLowerCase()
        .startsWith(search.trim().toLowerCase());
    });
  }, [products, search]);

  useEffect(() => {
    setShowAll(false);
  }, [selectedCategory]);

  const visibleProducts = showAll
    ? filteredProducts
    : filteredProducts.slice(0, 5);

  const hasMoreProducts = filteredProducts.length > 5;

  return (
    <div className="products-card">
      <div className="products-header">
        <h2>Mahsulotlar</h2>
        <button className="add-product-btn" onClick={handleOpenAdd}>
          <FiPlus /> Mahsulot qo'shish
        </button>
      </div>

      <div className="products-search">
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Mahsulotlarni qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="products-table">
        <div className="table-head">
          <div>Rasm</div>
          <div>Nomi</div>
          <div>Kategoriya</div>
          <div>Narxi</div>
          <div>Holati</div>
          <div>Amallar</div>
        </div>

        <div className={`table-body ${showAll ? "scroll-mode" : ""}`}>
          {loading ? (
            <div className="no-products">Yuklanmoqda...</div>
          ) : visibleProducts.length === 0 ? (
            <div className="no-products">Hech qanday mahsulot topilmadi</div>
          ) : (
            visibleProducts.map((item) => {
              const nameUz = typeof item.name === 'object' ? item.name?.uz : item.name;
              
              const rawImage = item.image_url || item.image;
              const imageName = typeof rawImage === 'string' ? rawImage.trim() : '';
              let imageUrl = imageName;
              if (imageName && !imageName.startsWith('http')) {
                const { data } = supabase
                  .storage
                  .from('categories')
                  .getPublicUrl(imageName);
                imageUrl = data.publicUrl;
              }

              const prodStatus = item.status || "active";

              return (
                <div className="table-row" key={item.id}>
                  <div className="product-image">
                    <img
                      src={imageUrl}
                      alt={nameUz}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>

                  <div className="product-name">{nameUz}</div>
                  <div className="product-category">{item.category_id}</div>
                  <div className="product-price">{item.price}</div>
                  <div className="product-status">
                    <span className={prodStatus === "active" ? "active-status" : "inactive-status"}>
                      {prodStatus === "active" ? "Faol" : "Nofaol"}
                    </span>
                  </div>

                  <div className="product-actions">
                    <button className="action-btn edit-btn" onClick={() => handleOpenEdit(item)} title="Tahrirlash"><FiEdit2 /></button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteProduct(item.id)} title="O'chirish"><FiTrash2 /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="products-footer">
          {hasMoreProducts && (
            <button
              className="view-product-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Kamroq ko'rsatish" : "Barcha mahsulotlarni ko'rish"}
            </button>
          )}
        </div>
      </div>

      {/* MAHSULOT QO'SHISH MODALI */}
      {isAddModalOpen && (
        <div className="product-modal-overlay">
          <div className="product-modal-content">
            <div className="modal-header-custom">
              <h3>Yangi mahsulot qo'shish</h3>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleCreateProduct} className="modal-form">
              <div className="form-group">
                <label>Nomi (UZ)</label>
                <input type="text" value={nameUz} onChange={(e) => setNameUz(e.target.value)} required placeholder="Mahsulot nomi" />
              </div>
              <div className="form-group">
                <label>Nomi (RU)</label>
                <input type="text" value={nameRu} onChange={(e) => setNameRu(e.target.value)} required placeholder="Название товара" />
              </div>
              <div className="form-group">
                <label>Nomi (EN)</label>
                <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required placeholder="Product name" />
              </div>
              <div className="form-group">
                <label>Narxi</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="Narxi" />
              </div>
              <div className="form-group">
                <label>Kategoriya</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">Kategoriyani tanlang</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name_uz || cat.id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Rasm (URL yoki kompyuterdan yuklash)</label>
                <div className="image-input-container">
                  <input type="text" value={image} onChange={(e) => setImage(e.target.value)} required placeholder="URL yoki rasm yuklang" />
                  <label className="file-upload-label" title="Fayl tanlash">
                    <FiUpload />
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
                {uploading && <span className="uploading-text">Rasm yuklanmoqda...</span>}
              </div>
              <div className="form-group">
                <label>Holati</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
              <button type="submit" className="modal-save-btn">Mahsulot qo'shish</button>
            </form>
          </div>
        </div>
      )}

      {/* MAHSULOTNI TAHRIRLASH MODALI */}
      {isEditModalOpen && (
        <div className="product-modal-overlay">
          <div className="product-modal-content">
            <div className="modal-header-custom">
              <h3>Mahsulotni tahrirlash</h3>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}><FiX /></button>
            </div>

            <form onSubmit={handleUpdateProduct} className="modal-form">
              <div className="form-group">
                <label>Nomi (UZ)</label>
                <input type="text" value={nameUz} onChange={(e) => setNameUz(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Nomi (RU)</label>
                <input type="text" value={nameRu} onChange={(e) => setNameRu(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Nomi (EN)</label>
                <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Narxi</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Kategoriya</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name_uz || cat.id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Rasm (URL yoki kompyuterdan yuklash)</label>
                <div className="image-input-container">
                  <input type="text" value={image} onChange={(e) => setImage(e.target.value)} required />
                  <label className="file-upload-label" title="Fayl tanlash">
                    <FiUpload />
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
                {uploading && <span className="uploading-text">Rasm yuklanmoqda...</span>}
              </div>
              <div className="form-group">
                <label>Holati</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
              <button type="submit" className="modal-save-btn">O'zgarishlarni saqlash</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}