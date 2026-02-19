import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { clearStoredUser } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getTimelineSteps(order) {
  const payment = String(order?.paymentStatus || "").toLowerCase();
  const status = String(order?.orderStatus || "").toLowerCase();
  const cancelled = status === "cancelled";
  const paid = payment === "paid";
  const processing = status === "processing" || status === "shipped" || status === "delivered";
  const shipped = status === "shipped" || status === "delivered";
  const delivered = status === "delivered";

  return [
    { key: "placed", label: "Order Placed", done: true, cancelled },
    { key: "paid", label: "Paid", done: paid, cancelled: cancelled && !paid },
    { key: "processing", label: "Processing", done: processing, cancelled: cancelled && !processing },
    { key: "shipped", label: "Shipped", done: shipped, cancelled: cancelled && !shipped },
    { key: "delivered", label: "Delivered", done: delivered, cancelled: cancelled && !delivered },
  ];
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("shop"); // shop | cart | checkout | orders
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [checkoutOrderId, setCheckoutOrderId] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);
  const [busyProductId, setBusyProductId] = useState("");
  const [busyCartProductId, setBusyCartProductId] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // continue local cleanup even if server logout fails
    }
    clearStoredUser();
    navigate("/login");
  };

  const fetchProducts = async (q = "") => {
    try {
      setLoadingProducts(true);
      const endpoint = q.trim()
        ? `${API_BASE}/api/product/search?q=${encodeURIComponent(q.trim())}`
        : `${API_BASE}/api/product/get`;
      const res = await axios.get(endpoint);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCart = async () => {
    try {
      setLoadingCart(true);
      const res = await axios.get(`${API_BASE}/api/cart/mycart`, {
        withCredentials: true,
      });
      setCart(res?.data?.cart || { items: [] });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch cart");
    } finally {
      setLoadingCart(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/order/customer/orders`, {
        withCredentials: true,
      });
      const list = Array.isArray(res?.data?.orders) ? res.data.orders : [];
      setOrders(list);
      setCheckoutOrderId((prev) => {
        if (prev && list.some((order) => String(order.orderId) === String(prev))) {
          return prev;
        }
        const next =
          list.find(
            (order) =>
              !["cancelled", "delivered"].includes(
                String(order.orderStatus || "").toLowerCase()
              )
          ) || list[0];
        return next?.orderId || "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch orders");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCart();
    fetchOrders();
  }, []);

  const cartTotal = useMemo(() => {
    return (cart?.items || []).reduce((sum, item) => {
      const price = Number(item?.product?.price || 0);
      const quantity = Number(item?.quantity || 0);
      return sum + price * quantity;
    }, 0);
  }, [cart]);

  const checkoutOrder = useMemo(() => {
    return orders.find((order) => String(order.orderId) === String(checkoutOrderId));
  }, [orders, checkoutOrderId]);

  const onSearchSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    await fetchProducts(search);
  };

  const goToCart = async () => {
    setActiveView("cart");
    await fetchCart();
  };

  const addToCart = async (productId) => {
    try {
      setBusyProductId(productId);
      setMessage("");
      setError("");
      await axios.post(
        `${API_BASE}/api/cart/addcart`,
        { productId, quantity: 1 },
        { withCredentials: true }
      );
      setMessage("Added to cart");
      await fetchCart();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add to cart");
    } finally {
      setBusyProductId("");
    }
  };

  const updateCartQuantity = async (productId, nextQuantity) => {
    if (nextQuantity < 1) return;
    try {
      setBusyCartProductId(productId);
      setMessage("");
      setError("");
      await axios.put(
        `${API_BASE}/api/cart/updatecartitem`,
        { productId, quantity: nextQuantity },
        { withCredentials: true }
      );
      await fetchCart();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update cart item");
    } finally {
      setBusyCartProductId("");
    }
  };

  const removeCartItem = async (productId) => {
    try {
      setBusyCartProductId(productId);
      setMessage("");
      setError("");
      await axios.delete(`${API_BASE}/api/cart/removecartitem/${productId}`, {
        withCredentials: true,
      });
      setMessage("Item removed");
      await fetchCart();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove item");
    } finally {
      setBusyCartProductId("");
    }
  };

  const placeOrder = async () => {
    try {
      setPlacingOrder(true);
      setMessage("");
      setError("");
      const res = await axios.post(
        `${API_BASE}/api/order/placeorder`,
        {},
        { withCredentials: true }
      );
      const createdOrderId = res?.data?.order?._id;
      await Promise.all([fetchCart(), fetchOrders()]);
      if (createdOrderId) {
        setCheckoutOrderId(createdOrderId);
      }
      setActiveView("checkout");
      setMessage("Order placed. Complete payment or cancel.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const payOrder = async (orderId) => {
    try {
      setMessage("");
      setError("");
      await axios.post(
        `${API_BASE}/api/order/${orderId}/pay`,
        {},
        { withCredentials: true }
      );
      setMessage("Payment successful");
      await fetchOrders();
    } catch (err) {
      setError(err?.response?.data?.message || "Payment failed");
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      setMessage("");
      setError("");
      await axios.post(
        `${API_BASE}/api/order/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );
      setMessage("Order cancelled");
      await fetchOrders();
      await fetchProducts(search);
    } catch (err) {
      setError(err?.response?.data?.message || "Cancel failed");
    }
  };

  return (
    <div className="daraz-shell">
      <header className="daraz-header">
        <div>
          <p className="daraz-kicker">Customer Dashboard</p>
          <h1>Shop</h1>
        </div>
        <div className="daraz-nav-actions">
          <button
            className={`btn-inline ${activeView === "shop" ? "daraz-tab-active" : "btn-ghost"}`}
            onClick={() => setActiveView("shop")}
          >
            Shop
          </button>
          <button
            className={`btn-inline ${activeView === "cart" ? "daraz-tab-active" : "btn-ghost"}`}
            onClick={goToCart}
          >
            My Cart ({(cart?.items || []).length})
          </button>
          <button
            className={`btn-inline ${activeView === "checkout" ? "daraz-tab-active" : "btn-ghost"}`}
            onClick={() => setActiveView("checkout")}
          >
            Checkout
          </button>
          <button
            className={`btn-inline ${activeView === "orders" ? "daraz-tab-active" : "btn-ghost"}`}
            onClick={() => {
              setActiveView("orders");
              fetchOrders();
            }}
          >
            All Orders
          </button>
          <button className="btn-ghost btn-inline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {message && <div className="dash-alert success">{message}</div>}
      {error && <div className="dash-alert error">{error}</div>}

      {activeView === "shop" && (
        <section className="daraz-section">
          <form className="daraz-search-row" onSubmit={onSearchSubmit}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
            />
            <button className="btn-primary btn-inline" type="submit">
              Search
            </button>
          </form>

          {loadingProducts && <p className="muted-text">Loading products...</p>}

          <div className="daraz-product-grid">
            {products.map((product) => (
              <article key={product._id} className="daraz-product-card">
                <div className="daraz-product-image-wrap">
                  <img
                    src={product?.image?.url}
                    alt={product?.title || "Product image"}
                    className="daraz-product-image"
                  />
                </div>
                <div className="daraz-product-body">
                  <h3>{product.title}</h3>
                  <p className="daraz-product-price">{formatCurrency(product.price)}</p>
                  <p className="daraz-product-stock">Stock: {product.stock}</p>
                  <button
                    className="btn-primary btn-inline"
                    disabled={busyProductId === product._id || Number(product.stock || 0) < 1}
                    onClick={() => addToCart(product._id)}
                  >
                    {Number(product.stock || 0) < 1
                      ? "Out of Stock"
                      : busyProductId === product._id
                      ? "Adding..."
                      : "Add to Cart"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeView === "cart" && (
        <section className="daraz-section">
          <h2>My Cart</h2>
          {loadingCart && <p className="muted-text">Loading cart...</p>}
          {!loadingCart && (cart?.items || []).length === 0 && (
            <div className="empty-state">
              <h2>Cart is empty</h2>
              <p>Add items from Shop.</p>
            </div>
          )}
          <div className="daraz-cart-list">
            {(cart?.items || []).map((item) => {
              const product = item?.product;
              if (!product?._id) return null;
              return (
                <article className="daraz-cart-item" key={product._id}>
                  <div>
                    <p className="daraz-cart-title">{product.title}</p>
                    <p className="daraz-cart-meta">{formatCurrency(product.price)} each</p>
                  </div>
                  <div className="daraz-cart-controls">
                    <button
                      className="btn-ghost btn-inline"
                      onClick={() => updateCartQuantity(product._id, Number(item.quantity) - 1)}
                      disabled={busyCartProductId === product._id || Number(item.quantity) <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="btn-ghost btn-inline"
                      onClick={() => updateCartQuantity(product._id, Number(item.quantity) + 1)}
                      disabled={busyCartProductId === product._id}
                    >
                      +
                    </button>
                    <button
                      className="btn-danger btn-inline"
                      onClick={() => removeCartItem(product._id)}
                      disabled={busyCartProductId === product._id}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="daraz-cart-footer">
            <p>Total: {formatCurrency(cartTotal)}</p>
            <button
              className="btn-primary btn-inline"
              onClick={placeOrder}
              disabled={placingOrder || (cart?.items || []).length === 0}
            >
              {placingOrder ? "Placing..." : "Place Order"}
            </button>
          </div>
        </section>
      )}

      {activeView === "checkout" && (
        <section className="daraz-section">
          <h2>Checkout</h2>

          {!checkoutOrder && (
            <div className="empty-state">
              <h2>No active checkout</h2>
              <p>Place an order from My Cart first.</p>
            </div>
          )}

          {checkoutOrder && (
            <article className="daraz-checkout-card">
              <p>Order ID: #{String(checkoutOrder.orderId).slice(-8)}</p>
              <p>Total: {formatCurrency(checkoutOrder.totalAmount)}</p>
              <p>Payment: {checkoutOrder.paymentStatus}</p>
              <p>Status: {checkoutOrder.orderStatus}</p>

              <div className="daraz-timeline">
                {getTimelineSteps(checkoutOrder).map((step) => (
                  <div
                    key={step.key}
                    className={`daraz-timeline-step ${
                      step.done ? "is-done" : step.cancelled ? "is-cancelled" : ""
                    }`}
                  >
                    <span className="daraz-timeline-dot" />
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>

              <div className="card-actions">
                {checkoutOrder.paymentStatus !== "paid" &&
                  checkoutOrder.orderStatus !== "cancelled" && (
                    <button
                      className="btn-primary btn-inline"
                      onClick={() => payOrder(checkoutOrder.orderId)}
                    >
                      Pay
                    </button>
                  )}
                {!["cancelled", "shipped", "delivered"].includes(checkoutOrder.orderStatus) && (
                  <button
                    className="btn-danger btn-inline"
                    onClick={() => cancelOrder(checkoutOrder.orderId)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </article>
          )}
        </section>
      )}

      {activeView === "orders" && (
        <section className="daraz-section">
          <h2>All Orders</h2>
          {orders.length === 0 && (
            <div className="empty-state">
              <h2>No orders found</h2>
              <p>Your order history will appear here.</p>
            </div>
          )}
          <div className="daraz-order-list">
            {orders.map((order) => (
              <article className="daraz-order-card" key={order.orderId}>
                <div className="daraz-order-top">
                  <p className="daraz-cart-title">Order #{String(order.orderId).slice(-8)}</p>
                  <span className="seller-badge">{order.orderStatus}</span>
                </div>
                <p className="muted-text">
                  Payment: {order.paymentStatus} | Total: {formatCurrency(order.totalAmount)}
                </p>
                <div className="daraz-order-items">
                  {(order.items || []).map((item, index) => (
                    <p key={`${order.orderId}-${index}`}>
                      {item.productName} x {item.quantity} ({item.status})
                    </p>
                  ))}
                </div>
                <div className="card-actions">
                  <button
                    className="btn-ghost btn-inline"
                    onClick={() => {
                      setCheckoutOrderId(order.orderId);
                      setActiveView("checkout");
                    }}
                  >
                    Open in Checkout
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CustomerDashboard;
