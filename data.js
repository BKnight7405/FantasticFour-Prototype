/**
 * CUSports Prototype — Synthetic Data
 * All names, products, and orders below are fictional and created only
 * for this prototype. No real customers, payments, or inventory data.
 *
 * Availability status values (see US-01 / AT-01a..AT-01D):
 *   "available"   — in stock and orderable
 *   "unavailable" — known to be out of stock
 *   "unknown"     — availability could not be determined (must NOT be
 *                   displayed or treated as available)
 */

const CUSportsData = (function () {
  const products = [
    {
      id: "p1",
      name: "Clemson Tigers Home Jersey",
      category: "Apparel",
      price: 89.99,
      status: "available",
      icon: "🏉",
      description:
        "Official home jersey with an embroidered Tiger Paw logo. True to size, orange and purple trim."
    },
    {
      id: "p2",
      name: "Clemson Tigers Away Jersey",
      category: "Apparel",
      price: 89.99,
      status: "unavailable",
      icon: "🏉",
      description:
        "Away jersey in white with orange color-block panels. Currently out of stock at all warehouses."
    },
    {
      id: "p3",
      name: "Clemson Paw Print Cap",
      category: "Headwear",
      price: 24.99,
      status: "available",
      icon: "🧢",
      description: "Adjustable cap with an embroidered Tiger Paw logo. One size fits most."
    },
    {
      id: "p4",
      name: "Clemson Tigers Pullover Hoodie",
      category: "Apparel",
      price: 54.99,
      status: "unknown",
      icon: "👕",
      description:
        "Heavyweight fleece pullover hoodie. Warehouse stock count is still being verified."
    },
    {
      id: "p5",
      name: "Clemson Tigers Basketball",
      category: "Equipment",
      price: 19.99,
      status: "available",
      icon: "🏀",
      description: "Official size and weight rubber basketball with a Tiger Paw print."
    },
    {
      id: "p6",
      name: "Clemson Tigers Knit Scarf",
      category: "Accessories",
      price: 14.99,
      status: "unavailable",
      icon: "🧣",
      description: "Orange and purple striped knit scarf. Sold out for the season."
    },
    {
      id: "p7",
      name: "Clemson Tigers Water Bottle",
      category: "Accessories",
      price: 12.99,
      status: "available",
      icon: "🥤",
      description: "24oz insulated stainless steel water bottle with a Tiger Paw decal."
    },
    {
      id: "p8",
      name: "Clemson Tigers Backpack",
      category: "Accessories",
      price: 39.99,
      status: "unknown",
      icon: "🎒",
      description:
        "Padded laptop backpack with Tiger Paw embroidery. Inventory feed from the supplier has not confirmed a count yet."
    }
  ];

  const customers = [
    { id: "cust-1", name: "Ashley Carter" },
    { id: "cust-2", name: "Jordan Lee" }
  ];

  // Orders are mutable at runtime (new orders get pushed on here; shipping
  // info can be added to simulate a carrier update). This array is the
  // single source of truth the UI always reads from (AT-03D, AT-04C).
  const orders = [
    {
      id: "ORD-1001",
      customerId: "cust-1",
      date: "2026-09-10",
      items: [
        { productId: "p1", qty: 1, price: 89.99 },
        { productId: "p7", qty: 2, price: 12.99 }
      ],
      total: 115.97,
      paymentStatus: "approved",
      shipping: {
        carrier: "UPS",
        tracking: "1Z999AA10123456784",
        status: "Delivered",
        estimatedDelivery: "2026-09-14"
      }
    },
    {
      id: "ORD-1002",
      customerId: "cust-1",
      date: "2026-09-18",
      items: [{ productId: "p3", qty: 1, price: 24.99 }],
      total: 24.99,
      paymentStatus: "approved",
      shipping: null // Not yet shipped — must not be fabricated (AT-04B)
    }
    // cust-2 (Jordan Lee) intentionally has zero orders to demonstrate the
    // empty state (AT-03C) and confirm order lists never leak across customers.
  ];

  function getProduct(id) {
    return products.find((p) => p.id === id) || null;
  }

  function getCustomer(id) {
    return customers.find((c) => c.id === id) || null;
  }

  function getOrdersForCustomer(customerId) {
    return orders.filter((o) => o.customerId === customerId);
  }

  function getOrder(id) {
    return orders.find((o) => o.id === id) || null;
  }

  function nextOrderId() {
    const max = orders.reduce((m, o) => {
      const n = parseInt(o.id.replace("ORD-", ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 1000);
    return "ORD-" + (max + 1);
  }

  return {
    products,
    customers,
    orders,
    getProduct,
    getCustomer,
    getOrdersForCustomer,
    getOrder,
    nextOrderId
  };
})();
