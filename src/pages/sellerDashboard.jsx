import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { clearStoredUser } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialForm = {
  title: "",
  description: "",
  price: "",
  stock: "0",
  category: "",
  image: null,
};

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function toFormData(form) {
  // Backend expects multipart/form-data for image upload routes.
  const formData = new FormData();
  formData.append("title", form.title);
  formData.append("description", form.description);
  formData.append("price", form.price);
  formData.append("stock", form.stock);
  formData.append("category", form.category);
  if (form.image) {
    formData.append("image", form.image);
  }
  return formData;
}

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const activeEditProduct = useMemo(
    () => products.find((item) => item._id === editId),
    [products, editId]
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      // Uses GET /api/product/my so seller gets only own products.
      const res = await axios.get(`${API_BASE}/api/product/my`, {
        withCredentials: true,
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/category/get`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setCategories([]);
      setError(err?.response?.data?.message || "Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleLogout = () => {
    clearStoredUser();
    navigate("/login");
  };

  const onCreateChange = (e) => {
    const { name, value, files } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: name === "image" ? files?.[0] || null : value,
    }));
  };

  const onEditChange = (e) => {
    const { name, value, files } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "image" ? files?.[0] || null : value,
    }));
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setCreating(true);
      // Create product with the same fields expected by createProduct controller.
      await axios.post(`${API_BASE}/api/product/create`, toFormData(createForm), {
        withCredentials: true,
      });
      setMessage("Product created successfully.");
      setCreateForm(initialForm);
      setShowCreate(false);
      await fetchProducts();
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      const serverError = err?.response?.data?.error;
      setError([serverMessage, serverError].filter(Boolean).join(": ") || "Product creation failed");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (product) => {
    setMessage("");
    setError("");
    setEditId(product._id);
    setEditForm({
      title: product.title || "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "0",
      category: product.category?._id || product.category || "",
      image: null,
    });
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    if (!editId) return;
    setMessage("");
    setError("");

    try {
      setUpdating(true);
      // Update product and optionally replace image.
      await axios.put(
        `${API_BASE}/api/product/update/${editId}`,
        toFormData(editForm),
        { withCredentials: true }
      );
      setMessage("Product updated successfully.");
      setEditId(null);
      setEditForm(initialForm);
      await fetchProducts();
    } catch (err) {
      setError(err?.response?.data?.message || "Product update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this product? This action cannot be undone."
    );
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      setDeletingId(id);
      // Delete product by id using your protected delete route.
      await axios.delete(`${API_BASE}/api/product/deleteProduct/${id}`, {
        withCredentials: true,
      });
      setMessage("Product deleted successfully.");
      setProducts((prev) => prev.filter((item) => item._id !== id));
      if (editId === id) {
        setEditId(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Product deletion failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <div>
          <p className="dash-kicker">Seller Workspace</p>
          <h1>Seller Dashboard</h1>
          <p className="dash-subtitle">
            Manage only your products with create, update, and delete actions.
          </p>
        </div>
        <div className="dash-actions">
          <button
            className="btn-primary btn-inline"
            onClick={() => setShowCreate((prev) => !prev)}
          >
            {showCreate ? "Close Create Form" : "Create Product"}
          </button>
          <button className="btn-ghost btn-inline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {message && <div className="dash-alert success">{message}</div>}
      {error && <div className="dash-alert error">{error}</div>}

      {showCreate && (
        <section className="form-panel">
          <h2>Create Product</h2>
          <form className="product-form" onSubmit={submitCreate}>
            <input
              name="title"
              placeholder="Product name"
              value={createForm.title}
              onChange={onCreateChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={createForm.description}
              onChange={onCreateChange}
              required
            />
            <input
              name="price"
              type="number"
              step="0.01"
              placeholder="Price"
              value={createForm.price}
              onChange={onCreateChange}
              required
            />
            <input
              name="stock"
              type="number"
              placeholder="Stock"
              value={createForm.stock}
              onChange={onCreateChange}
            />
            <select
              name="category"
              value={createForm.category}
              onChange={onCreateChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={onCreateChange}
              required
            />
            <button className="btn-primary btn-inline" disabled={creating}>
              {creating ? "Creating..." : "Create Product"}
            </button>
          </form>
        </section>
      )}

      <section className="product-grid">
        {loading && <p className="muted-text">Loading products...</p>}
        {!loading && products.length === 0 && (
          <div className="empty-state">
            <h2>No products found</h2>
            <p>Create your first product to populate this dashboard.</p>
          </div>
        )}

        {!loading &&
          products.map((product) => (
            <article className="product-card" key={product._id}>
              <div className="product-image-wrap">
                <img
                  src={product?.image?.url}
                  alt={product?.title || "Product image"}
                  className="product-image"
                />
              </div>

              <div className="product-body">
                <h3>{product.title}</h3>
                <p className="product-desc">{product.description}</p>
                <p>
                  <strong>Price:</strong> ${Number(product.price || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Stock:</strong> {product.stock}
                </p>
                <p>
                  <strong>Created:</strong> {formatDate(product.createdAt)}
                </p>

                <div className="card-actions">
                  <button
                    className="btn-ghost btn-inline"
                    onClick={() => startEdit(product)}
                  >
                    Update
                  </button>
                  <button
                    className="btn-danger btn-inline"
                    onClick={() => handleDelete(product._id)}
                    disabled={deletingId === product._id}
                  >
                    {deletingId === product._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {editId === product._id && (
                <div className="edit-panel">
                  <h4>Update Product</h4>
                  <form className="product-form" onSubmit={submitUpdate}>
                    <input
                      name="title"
                      placeholder="Product name"
                      value={editForm.title}
                      onChange={onEditChange}
                      required
                    />
                    <textarea
                      name="description"
                      placeholder="Description"
                      value={editForm.description}
                      onChange={onEditChange}
                      required
                    />
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={editForm.price}
                      onChange={onEditChange}
                    />
                    <input
                      name="stock"
                      type="number"
                      placeholder="Stock"
                      value={editForm.stock}
                      onChange={onEditChange}
                    />
                    <select
                      name="category"
                      value={editForm.category}
                      onChange={onEditChange}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <input
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={onEditChange}
                    />
                    <div className="card-actions">
                      <button
                        className="btn-primary btn-inline"
                        disabled={updating}
                      >
                        {updating && activeEditProduct?._id === product._id
                          ? "Updating..."
                          : "Save Update"}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-inline"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </article>
          ))}
      </section>
    </div>
  );
};

export default SellerDashboard;
