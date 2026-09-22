import React, { useState, useEffect, useCallback } from "react";
import "./Categories.css";

import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiX,
  FiUpload
} from "react-icons/fi";

import { supabase } from "../../supabase/supabase";

export default function Categories({
  selectedCategory,
  setSelectedCategory,
}) {
  const [categories, setCategories] = useState([]);
  const [productsCount, setProductsCount] = useState({});
  const [showAll, setShowAll] = useState(false);

  // Edit modal holatlari
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Add modal holatlari
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form input state'lari
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState("active");
  const [uploading, setUploading] = useState(false);

  // Ma'lumotlarni olish
  const fetchCategoriesAndProducts = useCallback(async () => {
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*');

      if (catError) {
        console.error("Kategoriyalarni olishda xatolik:", catError.message);
      } else {
        setCategories(catData || []);
        if (catData && catData.length > 0 && !selectedCategory) {
          setSelectedCategory(catData[0].id);
        }
      }

      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('category_id');

      if (prodError) {
        console.error("Mahsulotlarni olishda xatolik:", prodError.message);
      } else if (prodData) {
        const counts = {};
        prodData.forEach((item) => {
          counts[item.category_id] = (counts[item.category_id] || 0) + 1;
        });
        setProductsCount(counts);
      }
    } catch (err) {
      console.error("Kutilmagan xatolik:", err);
    }
  }, [selectedCategory, setSelectedCategory]);

  useEffect(() => {
    fetchCategoriesAndProducts();
  }, [fetchCategoriesAndProducts]);

  // Add modalini ochish
  const handleOpenAdd = () => {
    setNameUz("");
    setNameRu("");
    setNameEn("");
    setImage("");
    setStatus("active");
    setIsAddModalOpen(true);
  };

  // Yangi kategoriya qo'shish
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    const slug = nameEn ? nameEn.toLowerCase().replace(/\s+/g, '-') : 'category';
    const generatedId = `${slug}-${Date.now()}`;

    const { error } = await supabase
      .from('categories')
      .insert([
        {
          id: generatedId,
          name_uz: nameUz,
          name_ru: nameRu,
          name_en: nameEn,
          image: image,
          status: status,
        }
      ]);

    if (error) {
      console.error("Qo'shishda xatolik:", error);
      alert(`Xatolik yuz berdi: ${error.message}`);
    } else {
      setIsAddModalOpen(false);
      fetchCategoriesAndProducts();
    }
  };

  // Edit modalini ochish
  const handleOpenEdit = (category, e) => {
    e.stopPropagation();
    setEditingCategory(category);
    setNameUz(category.name_uz || "");
    setNameRu(category.name_ru || "");
    setNameEn(category.name_en || "");
    setImage(category.image || "");
    setStatus(category.status || "active");
    setIsEditModalOpen(true);
  };

  // Rasmni yuklash
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
      console.error("Rasmni yuklashda xatolik:", error);
      alert("Rasmni yuklab bo'lmadi!");
    } finally {
      setUploading(false);
    }
  };

  // Yangilash
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    const { error } = await supabase
      .from('categories')
      .update({
        name_uz: nameUz,
        name_ru: nameRu,
        name_en: nameEn,
        image: image,
        status: status,
      })
      .eq('id', editingCategory.id);

    if (error) {
      console.error("Yangilashda xatolik:", error);
      alert(`Xatolik yuz berdi: ${error.message}`);
    } else {
      setIsEditModalOpen(false);
      fetchCategoriesAndProducts();
    }
  };

  // O'chirish
  const handleDeleteCategory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Haqiqatan ham bu kategoriyani o'chirmoqchimisiz?")) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("O'chirishda xatolik:", error);
      alert("O'chirishda xatolik! Unga bog'langan mahsulotlar bo'lishi mumkin.");
    } else {
      fetchCategoriesAndProducts();
    }
  };

  const visibleCategories = showAll ? categories : categories.slice(0, 5);

  return (
    <div className="categories-card">
      <div className="categories-header">
        <h2>Kategoriyalar</h2>
        <button className="add-category-btn" onClick={handleOpenAdd}>
          <FiPlus /> Kategoriya qo'shish
        </button>
      </div>

      <div className="categories-list">
        {visibleCategories.map((category) => {
          const totalProducts = productsCount[category.id] || 0;
          const isSelected = selectedCategory === category.id;
          const catStatus = category.status || "active";

          return (
            <div
              key={category.id}
              className={`category-item ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="category-left">
                <img
                  src={category.image}
                  alt={category.name_uz || category.id}
                  className="category-image"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="category-info">
                  <h3>{category.name_uz}</h3>
                  <span>{totalProducts} ta mahsulot</span>
                </div>
              </div>

              <div className="category-actions">
                <span className={`status ${catStatus}`}>
                  {catStatus === "active" ? "Faol" : "Nofaol"}
                </span>
                <button className="edit-btn" onClick={(e) => handleOpenEdit(category, e)} title="Tahrirlash">
                  <FiEdit2 />
                </button>
                <button className="delete-btn" onClick={(e) => handleDeleteCategory(category.id, e)} title="O'chirish">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="categories-footer">
        <button className="view-category-btn" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Kamroq ko'rsatish" : "Barcha kategoriyalarni ko'rish"}
          <FiChevronRight />
        </button>
      </div>

      {/* MODAL: QO'SHISH */}
      {isAddModalOpen && (
        <div className="category-modal-overlay">
          <div className="category-modal-content">
            <div className="modal-header-custom">
              <h3>Yangi kategoriya qo'shish</h3>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreateCategory} className="modal-form">
              <div className="form-group">
                <label>Nomi (UZ)</label>
                <input type="text" value={nameUz} onChange={(e) => setNameUz(e.target.value)} placeholder="Masalan: Ichimliklar" required />
              </div>
              <div className="form-group">
                <label>Nomi (RU)</label>
                <input type="text" value={nameRu} onChange={(e) => setNameRu(e.target.value)} placeholder="Напитки" required />
              </div>
              <div className="form-group">
                <label>Nomi (EN)</label>
                <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Drinks" required />
              </div>
              <div className="form-group">
                <label>Rasm (URL yoki fayl)</label>
                <div className="image-input-container">
                  <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." required />
                  <label className="file-upload-label" title="Tanlash">
                    <FiUpload />
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
                {uploading && <span className="uploading-text">Yuklanmoqda...</span>}
              </div>
              <div className="form-group">
                <label>Holati</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
              <button type="submit" className="modal-save-btn">Kategoriya qo'shish</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAHRIRLASH */}
      {isEditModalOpen && (
        <div className="category-modal-overlay">
          <div className="category-modal-content">
            <div className="modal-header-custom">
              <h3>Kategoriyani tahrirlash</h3>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleUpdateCategory} className="modal-form">
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
                <label>Rasm</label>
                <div className="image-input-container">
                  <input type="text" value={image} onChange={(e) => setImage(e.target.value)} required />
                  <label className="file-upload-label">
                    <FiUpload />
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
                {uploading && <span className="uploading-text">Yuklanmoqda...</span>}
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