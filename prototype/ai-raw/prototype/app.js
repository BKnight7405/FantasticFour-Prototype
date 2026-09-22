/**
 * CUSports Prototype — Application Logic
 * Vanilla JS, hash-based router, no build step, no external services.
 * State lives in memory only (resets on full page reload).
 */

(function () {
  "use strict";

  const appEl = document.getElementById("app");
  const mainEl = document.getElementById("main");
  const cartCountEl = document.getElementById("cart-count");
  const customerSelectEl = document.getElementById("customer-select");
  const searchFormEl = document.getElementById("search-form");
  const searchInputEl = document.getElementById("search-input");
  const liveRegion = document.getElementById("live-region");

  const state = {
    currentCustomerId: CUSportsData.customers[0].id,
    cart: [] // { productId, qty }
  };

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatCurrency(n) {
    return "$" + n.toFixed(2);
  }

  function announce(message) {
    liveRegion.textContent = "";
    // Re-set on next tick so repeated identical messages are still announced.
    window.setTimeout(function () {
      liveRegion.textContent = message;
    }, 30);
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function focusMain() {
    // Move focus to the new screen's heading for screen-reader / keyboard users.
    const heading = appEl.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    } else {
      mainEl.focus();
    }
  }

  /**
   * Renders the availability badge for a product. Only "available" is ever
   * described as available (AT-01A). "unavailable" and "unknown" are always
   * rendered distinctly and never claim the item can be ordered (AT-01B, AT-01C).
   */
  function availabilityBadge(status) {
    if (status === "available") {
      return '<span class="badge badge-available">✔ Available</span>';
    }
    if (status === "unavailable") {
      return '<span class="badge badge-unavailable">✘ Out of stock</span>';
    }
    // "unknown" or any unrecognized value is treated the same conservative way.
    return '<span class="badge badge-unknown">⚠ Availability unknown</span>';
  }

  function cartTotalQty() {
    return state.cart.reduce((sum, line) => sum + line.qty, 0);
  }

  function cartLinesWithProducts() {
    return state.cart
      .map((line) => {
        const product = CUSportsData.getProduct(line.productId);
        return product ? { line, product } : null;
      })
      .filter(Boolean);
  }

  function updateCartCount() {
    cartCountEl.textContent = String(cartTotalQty());
  }

  function currentCustomer() {
    return CUSportsData.getCustomer(state.currentCustomerId);
  }

  // ---------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------

  function parseHash() {
    let hash = window.location.hash || "#/home";
    hash = hash.replace(/^#/, "");
    const parts = hash.split("/").filter(Boolean); // e.g. ["product", "p1"]
    return parts;
  }

  function render() {
    const parts = parseHash();
    const route = parts[0] || "home";

    if (route === "home") {
      renderHome(searchInputEl.value.trim());
    } else if (route === "product" && parts[1]) {
      renderProduct(parts[1]);
    } else if (route === "cart") {
      renderCart();
    } else if (route === "payment") {
      renderPayment();
    } else if (route === "orders" && !parts[1]) {
      renderOrders();
    } else if (route === "orders" && parts[1]) {
      renderOrderDetail(parts[1]);
    } else if (route === "confirmation" && parts[1]) {
      renderConfirmation(parts[1]);
    } else {
      renderNotFound();
    }

    updateCartCount();
    focusMain();
  }

  // ---------------------------------------------------------------
  // Screen: Home (browse + search)
  // ---------------------------------------------------------------

  function renderHome(searchTerm, categoryFilter) {
    categoryFilter = categoryFilter || "All";
    const categories = ["All"].concat(
      Array.from(new Set(CUSportsData.products.map((p) => p.category)))
    );

    let list = CUSportsData.products.slice();
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== "All") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    const chips = categories
      .map(
        (cat) =>
          `<button type="button" data-action="filter-category" data-category="${escapeHtml(
            cat
          )}" aria-pressed="${cat === categoryFilter ? "true" : "false"}">${escapeHtml(
            cat
          )}</button>`
      )
      .join("");

    const cardsHtml = list.length
      ? list
          .map(
            (p) => `
        <li class="product-card">
          <a class="product-link" href="#/product/${p.id}">
            <div class="icon" aria-hidden="true">${p.icon}</div>
            <h3>${escapeHtml(p.name)}</h3>
          </a>
          <p class="hint">${escapeHtml(p.category)}</p>
          ${availabilityBadge(p.status)}
          <p class="price">${formatCurrency(p.price)}</p>
          <a class="btn btn-secondary" href="#/product/${p.id}">View details</a>
        </li>`
          )
          .join("")
      : "";

    appEl.innerHTML = `
      <h1>Clemson Tigers Gear</h1>
      <p class="page-lede">Browse official Clemson sports products. Search by name or filter by category — availability is shown on every item.</p>

      <div class="toolbar">
        <div class="filter-chips" role="group" aria-label="Filter by category">
          ${chips}
        </div>
        ${
          searchTerm
            ? `<p>Showing results for <strong>"${escapeHtml(searchTerm)}"</strong> — <button type="button" class="btn btn-secondary" data-action="clear-search">Clear search</button></p>`
            : ""
        }
      </div>

      ${
        list.length
          ? `<ul class="product-grid">${cardsHtml}</ul>`
          : `<div class="empty-state" role="status">
               <p><strong>No products match your search.</strong></p>
               <p>Try a different term, such as "jersey" or "cap".</p>
             </div>`
      }
    `;

    // Wire category chip buttons for this render.
    appEl.querySelectorAll('[data-action="filter-category"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        renderHome(searchInputEl.value.trim(), btn.getAttribute("data-category"));
        announce(`Filtered to ${btn.getAttribute("data-category")}`);
      });
    });

    const clearBtn = appEl.querySelector('[data-action="clear-search"]');
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInputEl.value = "";
        renderHome("");
        searchInputEl.focus();
      });
    }
  }

  // ---------------------------------------------------------------
  // Screen: Product detail (US-01)
  // ---------------------------------------------------------------

  function renderProduct(productId) {
    const product = CUSportsData.getProduct(productId);

    if (!product) {
      appEl.innerHTML = `
        <p class="breadcrumb"><a href="#/home">&larr; Back to all products</a></p>
        <h1>Product not found</h1>
        <p>We couldn't find a product with ID "${escapeHtml(productId)}". It may have been removed.</p>
      `;
      return;
    }

    const isAvailable = product.status === "available";
    const inCart = state.cart.find((l) => l.productId === product.id);

    appEl.innerHTML = `
      <p class="breadcrumb"><a href="#/home">&larr; Back to all products</a></p>
      <div class="product-detail">
        <div>
          <div class="icon-large" aria-hidden="true">${product.icon}</div>
        </div>
        <div>
          <h1>${escapeHtml(product.name)}</h1>
          <p class="hint">${escapeHtml(product.category)}</p>
          <p>${availabilityBadge(product.status)}</p>
          <p class="price" style="font-size:1.4rem;">${formatCurrency(product.price)}</p>
          <p>${escapeHtml(product.description)}</p>

          <div class="field" style="max-width:160px;">
            <label for="qty-input">Quantity</label>
            <input type="number" id="qty-input" min="1" max="10" value="1" ${
              isAvailable ? "" : "disabled"
            } />
          </div>

          <p>
            <button
              type="button"
              class="btn btn-primary"
              data-action="add-to-cart"
              data-product-id="${product.id}"
              ${isAvailable ? "" : 'aria-disabled="true" disabled'}
            >
              ${isAvailable ? "Add to cart" : "Unavailable — cannot be ordered"}
            </button>
            ${inCart ? `<span class="hint"> (${inCart.qty} already in cart)</span>` : ""}
          </p>
          ${
            !isAvailable
              ? `<p role="status" class="hint">This item cannot be added to an order right now because its availability is "${escapeHtml(
                  product.status
                )}".</p>`
              : ""
          }

          <fieldset class="test-controls">
            <legend>Prototype testing controls</legend>
            <p>For demonstrating US-01/US-02 acceptance tests: change this product's live availability status and watch the badge and buttons update immediately.</p>
            <div role="radiogroup" aria-label="Set availability status for ${escapeHtml(product.name)}">
              <label>
                <input type="radio" name="status-test" value="available" data-action="set-status" data-product-id="${product.id}" ${
      product.status === "available" ? "checked" : ""
    } /> Available
              </label>
              <label>
                <input type="radio" name="status-test" value="unavailable" data-action="set-status" data-product-id="${product.id}" ${
      product.status === "unavailable" ? "checked" : ""
    } /> Unavailable
              </label>
              <label>
                <input type="radio" name="status-test" value="unknown" data-action="set-status" data-product-id="${product.id}" ${
      product.status === "unknown" ? "checked" : ""
    } /> Unknown
              </label>
            </div>
          </fieldset>
        </div>
      </div>
    `;

    const addBtn = appEl.querySelector('[data-action="add-to-cart"]');
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const fresh = CUSportsData.getProduct(product.id);
        if (fresh.status !== "available") {
          announce(`${fresh.name} is no longer available and was not added to your cart.`);
          renderProduct(product.id);
          return;
        }
        const qtyInput = document.getElementById("qty-input");
        const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        const existing = state.cart.find((l) => l.productId === product.id);
        if (existing) {
          existing.qty += qty;
        } else {
          state.cart.push({ productId: product.id, qty: qty });
        }
        updateCartCount();
        announce(`${fresh.name} added to cart.`);
        renderProduct(product.id);
      });
    }

    appEl.querySelectorAll('[data-action="set-status"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        const pid = radio.getAttribute("data-product-id");
        const p = CUSportsData.getProduct(pid);
        p.status = radio.value;
        announce(`Availability for ${p.name} set to ${radio.value}.`);
        renderProduct(pid);
      });
    });
  }

  // ---------------------------------------------------------------
  // Screen: Cart
  // ---------------------------------------------------------------

  function renderCart() {
    const lines = cartLinesWithProducts();
    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.line.qty, 0);
    const unavailableLines = lines.filter((l) => l.product.status !== "available");

    if (!lines.length) {
      appEl.innerHTML = `
        <h1>Your Cart</h1>
        <div class="empty-state" role="status">
          <p><strong>Your cart is empty.</strong></p>
          <p><a class="btn btn-primary" href="#/home">Browse products</a></p>
        </div>
      `;
      return;
    }

    const rows = lines
      .map(
        ({ line, product }) => `
      <tr>
        <td>${product.icon} ${escapeHtml(product.name)}</td>
        <td>${availabilityBadge(product.status)}</td>
        <td class="qty-cell">
          <label class="visually-hidden" for="qty-${product.id}">Quantity for ${escapeHtml(
          product.name
        )}</label>
          <input type="number" id="qty-${product.id}" min="1" max="10" value="${line.qty}" data-action="update-qty" data-product-id="${product.id}" style="width:4.5rem;" />
        </td>
        <td>${formatCurrency(product.price)}</td>
        <td>${formatCurrency(product.price * line.qty)}</td>
        <td><button type="button" class="btn btn-danger" data-action="remove-line" data-product-id="${product.id}">Remove</button></td>
      </tr>`
      )
      .join("");

    appEl.innerHTML = `
      <h1>Your Cart</h1>
      ${
        unavailableLines.length
          ? `<div class="alert alert-error" role="alert">
               <p><strong>Some items in your cart are no longer available and cannot be ordered:</strong></p>
               <ul>${unavailableLines
                 .map((l) => `<li>${escapeHtml(l.product.name)} — ${availabilityBadge(l.product.status)}</li>`)
                 .join("")}</ul>
               <p>Remove these items before checking out.</p>
             </div>`
          : ""
      }
      <table class="data-table">
        <caption class="visually-hidden">Items in your cart</caption>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Status</th>
            <th scope="col">Qty</th>
            <th scope="col">Price</th>
            <th scope="col">Line total</th>
            <th scope="col"><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="4">Subtotal</td>
            <td colspan="2">${formatCurrency(subtotal)}</td>
          </tr>
        </tfoot>
      </table>

      <p>
        <a class="btn btn-secondary" href="#/home">Continue shopping</a>
        <button
          type="button"
          class="btn btn-primary"
          data-action="go-to-payment"
          ${unavailableLines.length ? 'aria-disabled="true" disabled' : ""}
        >
          Proceed to payment
        </button>
      </p>
    `;

    appEl.querySelectorAll('[data-action="update-qty"]').forEach((input) => {
      input.addEventListener("change", () => {
        const pid = input.getAttribute("data-product-id");
        const qty = Math.max(1, Math.min(10, parseInt(input.value, 10) || 1));
        const l = state.cart.find((x) => x.productId === pid);
        if (l) l.qty = qty;
        updateCartCount();
        renderCart();
      });
    });

    appEl.querySelectorAll('[data-action="remove-line"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-product-id");
        const removed = CUSportsData.getProduct(pid);
        state.cart = state.cart.filter((x) => x.productId !== pid);
        updateCartCount();
        announce(`${removed ? removed.name : "Item"} removed from cart.`);
        renderCart();
      });
    });

    const payBtn = appEl.querySelector('[data-action="go-to-payment"]');
    if (payBtn) {
      payBtn.addEventListener("click", () => {
        if (unavailableLines.length) return;
        navigate("#/payment");
      });
    }
  }

  // ---------------------------------------------------------------
  // Screen: Payment / checkout (US-02)
  // ---------------------------------------------------------------

  function renderPayment() {
    const lines = cartLinesWithProducts();

    if (!lines.length) {
      appEl.innerHTML = `
        <h1>Payment</h1>
        <div class="empty-state" role="status">
          <p><strong>Your cart is empty.</strong> Add a product before checking out.</p>
          <p><a class="btn btn-primary" href="#/home">Browse products</a></p>
        </div>
      `;
      return;
    }

    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.line.qty, 0);

    appEl.innerHTML = `
      <p class="breadcrumb"><a href="#/cart">&larr; Back to cart</a></p>
      <h1>Payment &amp; Shipping</h1>

      <section aria-labelledby="order-summary-heading" class="order-summary-box">
        <h2 id="order-summary-heading">Order summary</h2>
        <ul>
          ${lines
            .map(
              (l) =>
                `<li>${l.line.qty} × ${escapeHtml(l.product.name)} — ${formatCurrency(
                  l.product.price * l.line.qty
                )}</li>`
            )
            .join("")}
        </ul>
        <p><strong>Total: ${formatCurrency(subtotal)}</strong></p>
      </section>

      <div id="payment-alert-region"></div>

      <form id="payment-form" novalidate>
        <fieldset>
          <legend>Shipping address</legend>
          <div class="form-grid">
            <div class="field full">
              <label for="ship-name">Full name</label>
              <input type="text" id="ship-name" name="shipName" autocomplete="name" value="${escapeHtml(
                currentCustomer().name
              )}" />
              <span class="field-error" id="err-ship-name"></span>
            </div>
            <div class="field full">
              <label for="ship-street">Street address</label>
              <input type="text" id="ship-street" name="shipStreet" autocomplete="street-address" placeholder="123 Tiger Blvd" />
              <span class="field-error" id="err-ship-street"></span>
            </div>
            <div class="field">
              <label for="ship-city">City</label>
              <input type="text" id="ship-city" name="shipCity" autocomplete="address-level2" placeholder="Clemson" />
              <span class="field-error" id="err-ship-city"></span>
            </div>
            <div class="field">
              <label for="ship-state">State</label>
              <input type="text" id="ship-state" name="shipState" autocomplete="address-level1" placeholder="SC" maxlength="2" />
              <span class="field-error" id="err-ship-state"></span>
            </div>
            <div class="field">
              <label for="ship-zip">ZIP code</label>
              <input type="text" id="ship-zip" name="shipZip" autocomplete="postal-code" placeholder="29631" inputmode="numeric" />
              <span class="field-error" id="err-ship-zip"></span>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Payment details</legend>
          <p class="hint">This is a prototype. Do not enter a real card number. Try <strong>4111 1111 1111 1111</strong> for an approved payment, or <strong>4000 0000 0000 0000</strong> to see a simulated decline.</p>
          <div class="form-grid">
            <div class="field full">
              <label for="card-name">Name on card</label>
              <input type="text" id="card-name" name="cardName" autocomplete="cc-name" />
              <span class="field-error" id="err-card-name"></span>
            </div>
            <div class="field full">
              <label for="card-number">Card number</label>
              <input type="text" id="card-number" name="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" />
              <span class="field-error" id="err-card-number"></span>
            </div>
            <div class="field">
              <label for="card-expiry">Expiry (MM/YY)</label>
              <input type="text" id="card-expiry" name="cardExpiry" autocomplete="cc-exp" placeholder="MM/YY" />
              <span class="field-error" id="err-card-expiry"></span>
            </div>
            <div class="field">
              <label for="card-cvv">Security code (CVV)</label>
              <input type="text" id="card-cvv" name="cardCvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" />
              <span class="field-error" id="err-card-cvv"></span>
            </div>
          </div>
        </fieldset>

        <p>
          <button type="submit" class="btn btn-primary">Place order</button>
        </p>
      </form>
    `;

    document.getElementById("payment-form").addEventListener("submit", onPaymentSubmit);
  }

  function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const err = document.getElementById("err-" + fieldId);
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", "err-" + fieldId);
      err.textContent = message;
    } else {
      input.removeAttribute("aria-invalid");
      err.textContent = "";
    }
  }

  function onPaymentSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const alertRegion = document.getElementById("payment-alert-region");
    alertRegion.innerHTML = "";

    const values = {
      shipName: form.shipName.value.trim(),
      shipStreet: form.shipStreet.value.trim(),
      shipCity: form.shipCity.value.trim(),
      shipState: form.shipState.value.trim(),
      shipZip: form.shipZip.value.trim(),
      cardName: form.cardName.value.trim(),
      cardNumber: form.cardNumber.value.replace(/\s+/g, ""),
      cardExpiry: form.cardExpiry.value.trim(),
      cardCvv: form.cardCvv.value.trim()
    };

    // Clear previous field errors.
    [
      "ship-name",
      "ship-street",
      "ship-city",
      "ship-state",
      "ship-zip",
      "card-name",
      "card-number",
      "card-expiry",
      "card-cvv"
    ].forEach((id) => setFieldError(id, ""));

    const errors = [];
    let firstInvalidId = null;

    function fail(fieldId, message) {
      setFieldError(fieldId, message);
      errors.push(message);
      if (!firstInvalidId) firstInvalidId = fieldId;
    }

    if (!values.shipName) fail("ship-name", "Enter the recipient's full name.");
    if (!values.shipStreet) fail("ship-street", "Enter a street address.");
    if (!values.shipCity) fail("ship-city", "Enter a city.");
    if (!/^[A-Za-z]{2}$/.test(values.shipState)) fail("ship-state", "Enter a 2-letter state code, e.g. SC.");
    if (!/^\d{5}$/.test(values.shipZip)) fail("ship-zip", "Enter a 5-digit ZIP code.");

    if (!values.cardName) fail("card-name", "Enter the name on the card.");
    if (!/^\d{16}$/.test(values.cardNumber)) fail("card-number", "Enter a 16-digit card number.");

    const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(values.cardExpiry);
    if (!expiryMatch) {
      fail("card-expiry", "Use MM/YY format, e.g. 09/28.");
    } else {
      const month = parseInt(expiryMatch[1], 10);
      const year = 2000 + parseInt(expiryMatch[2], 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (month < 1 || month > 12) {
        fail("card-expiry", "Enter a valid month (01–12).");
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        fail("card-expiry", "This card has expired.");
      }
    }

    if (!/^\d{3,4}$/.test(values.cardCvv)) fail("card-cvv", "Enter a 3- or 4-digit security code.");

    if (errors.length) {
      alertRegion.innerHTML = `
        <div class="alert alert-error" role="alert">
          <p><strong>We couldn't process your order — please fix the highlighted field(s).</strong></p>
        </div>`;
      const el = document.getElementById(firstInvalidId);
      if (el) el.focus();
      announce("The order could not be submitted because of validation errors.");
      return;
    }

    // Re-check availability of every cart line at the moment of submission.
    // If ANY item is no longer orderable, the whole order is rejected —
    // no partial / substituted order is ever silently created (AT-02B, AT-02C).
    const lines = cartLinesWithProducts();
    const nowUnavailable = lines.filter((l) => l.product.status !== "available");

    if (!lines.length) {
      alertRegion.innerHTML = `<div class="alert alert-error" role="alert"><p>Your cart is empty. Nothing was ordered.</p></div>`;
      return;
    }

    if (nowUnavailable.length) {
      alertRegion.innerHTML = `
        <div class="alert alert-error" role="alert">
          <p><strong>Order not placed.</strong> The following item(s) are no longer available, so no order was created:</p>
          <ul>${nowUnavailable
            .map((l) => `<li>${escapeHtml(l.product.name)} — ${availabilityBadge(l.product.status)}</li>`)
            .join("")}</ul>
          <p><a href="#/cart">Return to your cart</a> to remove the unavailable item(s) and try again.</p>
        </div>`;
      announce("Order not placed because an item in the cart is no longer available.");
      return;
    }

    // Simulated payment gateway: cards starting 4000 are always declined,
    // any other well-formed 16-digit number is approved. This mirrors the
    // common test-card convention and gives us a reliable error state.
    const declined = values.cardNumber.startsWith("4000");
    if (declined) {
      alertRegion.innerHTML = `
        <div class="alert alert-error" role="alert">
          <p><strong>Payment declined.</strong> Your card issuer reported insufficient funds. No order was created and your cart is unchanged.</p>
          <p>Try a different card number, or use 4111 1111 1111 1111 to simulate an approved payment.</p>
        </div>`;
      announce("Payment was declined. No order was created.");
      return;
    }

    // Approved: create the order and associate every ordered product with it.
    const orderId = CUSportsData.nextOrderId();
    const total = lines.reduce((sum, l) => sum + l.product.price * l.line.qty, 0);
    const newOrder = {
      id: orderId,
      customerId: state.currentCustomerId,
      date: new Date().toISOString().slice(0, 10),
      items: lines.map((l) => ({ productId: l.product.id, qty: l.line.qty, price: l.product.price })),
      total: total,
      paymentStatus: "approved",
      shipping: null // No shipping info yet — created at order time only (AT-04B).
    };
    CUSportsData.orders.push(newOrder);

    state.cart = [];
    updateCartCount();
    announce(`Order ${orderId} placed successfully.`);
    navigate("#/confirmation/" + orderId);
  }

  // ---------------------------------------------------------------
  // Screen: Order confirmation
  // ---------------------------------------------------------------

  function renderConfirmation(orderId) {
    const order = CUSportsData.getOrder(orderId);
    if (!order) {
      renderNotFound();
      return;
    }
    appEl.innerHTML = `
      <div class="alert alert-success" role="alert">
        <p><strong>Thank you! Your order has been placed.</strong></p>
      </div>
      <h1>Order ${escapeHtml(order.id)} confirmed</h1>
      <p>A summary of your order is below. You can revisit it anytime from <a href="#/orders">My Orders</a>.</p>
      <p>
        <a class="btn btn-primary" href="#/orders/${order.id}">View order details</a>
        <a class="btn btn-secondary" href="#/home">Continue shopping</a>
      </p>
    `;
  }

  // ---------------------------------------------------------------
  // Screen: Orders list (US-03)
  // ---------------------------------------------------------------

  function renderOrders() {
    const customer = currentCustomer();
    const myOrders = CUSportsData.getOrdersForCustomer(customer.id);

    if (!myOrders.length) {
      appEl.innerHTML = `
        <h1>My Orders</h1>
        <p class="page-lede">Signed in as ${escapeHtml(customer.name)}.</p>
        <div class="empty-state" role="status">
          <p><strong>You have no orders yet.</strong></p>
          <p><a class="btn btn-primary" href="#/home">Start shopping</a></p>
        </div>
      `;
      return;
    }

    const cards = myOrders
      .map((order) => {
        const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
        return `
        <li>
          <a class="order-card" href="#/orders/${order.id}">
            <span><strong>${escapeHtml(order.id)}</strong> — ${order.date}</span>
            <span>${itemCount} item(s)</span>
            <span>${formatCurrency(order.total)}</span>
            <span>${
              order.shipping
                ? `Shipping: ${escapeHtml(order.shipping.status)}`
                : "Shipping: not yet available"
            }</span>
          </a>
        </li>`;
      })
      .join("");

    appEl.innerHTML = `
      <h1>My Orders</h1>
      <p class="page-lede">Signed in as ${escapeHtml(customer.name)}. Only orders belonging to this account are shown.</p>
      <ul class="order-list">${cards}</ul>
    `;
  }

  // ---------------------------------------------------------------
  // Screen: Order detail (US-03, US-04)
  // ---------------------------------------------------------------

  function renderOrderDetail(orderId) {
    const order = CUSportsData.getOrder(orderId);
    const customer = currentCustomer();

    // Access control: an order can only be viewed by the customer it
    // belongs to (AT-03C). The currently "signed in" customer is chosen
    // via the account switcher in the header.
    if (!order || order.customerId !== customer.id) {
      appEl.innerHTML = `
        <p class="breadcrumb"><a href="#/orders">&larr; Back to my orders</a></p>
        <h1>Order not found</h1>
        <div class="alert alert-error" role="alert">
          <p>We couldn't find that order for ${escapeHtml(customer.name)}. It may belong to a different account, or the order ID may be incorrect.</p>
        </div>
      `;
      return;
    }

    const rows = order.items
      .map((item) => {
        const product = CUSportsData.getProduct(item.productId);
        const name = product ? product.name : "(product no longer listed)";
        return `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${item.qty}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(item.price * item.qty)}</td>
        </tr>`;
      })
      .join("");

    const shippingHtml = order.shipping
      ? `
        <div class="shipping-box">
          <h2>Shipping information</h2>
          <dl>
            <dt>Carrier</dt><dd>${escapeHtml(order.shipping.carrier)}</dd>
            <dt>Tracking number</dt><dd>${escapeHtml(order.shipping.tracking)}</dd>
            <dt>Status</dt><dd>${escapeHtml(order.shipping.status)}</dd>
            <dt>Estimated delivery</dt><dd>${escapeHtml(order.shipping.estimatedDelivery)}</dd>
          </dl>
        </div>`
      : `
        <div class="shipping-box pending" role="status">
          <h2>Shipping information</h2>
          <p><strong>Not yet available.</strong> This order has not shipped yet, so no tracking or delivery estimate is shown.</p>
          <fieldset class="test-controls">
            <legend>Prototype testing control</legend>
            <p>For demonstrating AT-04C (shipping updates reflect recorded changes):</p>
            <button type="button" class="btn btn-secondary" data-action="simulate-shipping" data-order-id="${order.id}">
              Simulate carrier update
            </button>
          </fieldset>
        </div>`;

    appEl.innerHTML = `
      <p class="breadcrumb"><a href="#/orders">&larr; Back to my orders</a></p>
      <h1>Order ${escapeHtml(order.id)}</h1>
      <p class="page-lede">Placed on ${escapeHtml(order.date)} by ${escapeHtml(customer.name)}. Payment status: ${escapeHtml(
      order.paymentStatus
    )}.</p>

      <table class="data-table">
        <caption>Items in this order</caption>
        <thead>
          <tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Price</th><th scope="col">Line total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3">Order total</td><td>${formatCurrency(order.total)}</td></tr>
        </tfoot>
      </table>

      ${shippingHtml}
    `;

    const simBtn = appEl.querySelector('[data-action="simulate-shipping"]');
    if (simBtn) {
      simBtn.addEventListener("click", () => {
        order.shipping = {
          carrier: "FedEx",
          tracking: "FX" + Math.floor(100000000 + Math.random() * 899999999),
          status: "In transit",
          estimatedDelivery: order.date
        };
        announce(`Shipping information added for order ${order.id}.`);
        renderOrderDetail(order.id);
      });
    }
  }

  // ---------------------------------------------------------------
  // Screen: 404
  // ---------------------------------------------------------------

  function renderNotFound() {
    appEl.innerHTML = `
      <h1>Page not found</h1>
      <p><a href="#/home">Return home</a></p>
    `;
  }

  // ---------------------------------------------------------------
  // Global header wiring (search + account switcher)
  // ---------------------------------------------------------------

  function populateCustomerSelect() {
    customerSelectEl.innerHTML = CUSportsData.customers
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join("");
    customerSelectEl.value = state.currentCustomerId;
  }

  customerSelectEl.addEventListener("change", () => {
    state.currentCustomerId = customerSelectEl.value;
    // Cart is per shopping session and does not carry across accounts in
    // this prototype, to keep the "signed in as" switch unambiguous.
    state.cart = [];
    updateCartCount();
    announce(`Switched account to ${currentCustomer().name}.`);
    if (window.location.hash.indexOf("#/orders") === 0 || window.location.hash.indexOf("#/cart") === 0) {
      render();
    } else {
      navigate("#/home");
    }
  });

  searchFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    navigate("#/home");
    renderHome(searchInputEl.value.trim());
    announce("Search results updated.");
  });

  window.addEventListener("hashchange", render);

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------

  populateCustomerSelect();
  if (!window.location.hash) {
    window.location.hash = "#/home";
  }
  render();
})();
