CUSports Prototype — README
============================

WHAT THIS IS
------------
A clickable, front-end-only prototype of the CUSports "browse and purchase"
customer workflow. There is no server and no build step. All data
(products, customers, orders) is synthetic and lives in data.js; state
changes (cart, new orders, shipping updates) are held in memory in the
browser tab and reset on a full page reload.

HOW TO LAUNCH
--------------
Option A (simplest): Double-click index.html to open it in any modern
browser (Chrome, Edge, Firefox, Safari). No internet connection is
required — the page loads no external fonts, scripts, or images.

Option B (if your browser restricts local file access for module-style
apps): serve the folder with any static file server, e.g.:
    npx serve .
or
    python3 -m http.server 8000
then visit http://localhost:8000/ (or the port shown).

FILES
-----
index.html   Start page / app shell (header, search, nav, mount point)
styles.css   All styling (Clemson-inspired colors, chosen for AA contrast)
data.js      Synthetic products, customers, and orders
app.js       Router + screen rendering + interaction logic (no dependencies)
README.txt   This file

SCREENS
-------
1. Home            — browse/search/filter products, see availability badges
2. Product detail  — full product info, availability, add to cart, and a
                      "prototype testing controls" panel to flip a
                      product's availability live
3. Cart            — review/edit quantities, remove items, blocked from
                      checkout if a cart item is no longer available
4. Payment         — shipping + card form with inline validation, a
                      simulated payment gateway (approve/decline), and an
                      availability re-check at submit time
5. Order confirmation — shown immediately after a successful order
6. My Orders       — list of the signed-in customer's own orders (or an
                      empty state)
7. Order detail    — order identity, line items, and shipping information
                      (or an honest "not yet available" message)

An "Signed in as" switcher in the header lets you swap between two
synthetic customers (Ashley Carter / Jordan Lee) to demonstrate that
orders and shipping info never leak across accounts.

HOW TO EXERCISE EACH ACCEPTANCE TEST
-------------------------------------
AT-01A (available status shown):
  Home or Product page for "Clemson Tigers Home Jersey" — shows a green
  "Available" badge.

AT-01B (unavailable never shown as available):
  Product page for "Clemson Tigers Away Jersey" — shows a red "Out of
  stock" badge; Add to cart is disabled.

AT-01C (unknown status never shown as available):
  Product page for "Clemson Tigers Pullover Hoodie" — shows an amber
  "Availability unknown" badge, never "Available"; Add to cart is disabled.

AT-01D (displayed status matches system data):
  On any product page, use the "Prototype testing controls" radio buttons
  to change the status. The badge and Add-to-cart button update
  immediately to match the new stored value.

AT-02A (order created for available items):
  Add "Clemson Paw Print Cap" to cart, go to Cart → Proceed to payment,
  fill the form, use card 4111 1111 1111 1111, submit. Order is created
  and you land on a confirmation page.

AT-02B (order not created if it contains an unavailable product):
  Add an available item to your cart, open its product page, use the
  testing controls to flip it to "Unavailable," then go to Cart. Checkout
  is blocked with an explicit warning; if you reach Payment and submit
  anyway (e.g. via direct navigation), the same re-check blocks order
  creation with no order created.

AT-02C (no silent substitution when one product fails):
  With two items in the cart, flip one to unavailable and submit payment.
  The error message names the specific unavailable item(s) and no order
  is created — the still-available item is not silently ordered alone.

AT-02D (ordered products associated with the order):
  After a successful checkout, open the order from "My Orders" — the line
  items are exactly the products you purchased.

AT-03A / AT-03B (order identity + products shown):
  Sign in as Ashley Carter → My Orders → open ORD-1001 or ORD-1002 — order
  ID, date, and each purchased product/qty/price are shown.

AT-03C (no cross-customer leakage / empty state):
  Switch "Signed in as" to Jordan Lee → My Orders shows the empty state
  ("You have no orders yet"), not Ashley Carter's orders.

AT-03D (displayed info reflects stored info):
  Any change made via the prototype's testing controls (e.g. simulated
  shipping update) is immediately reflected the next time the order is
  viewed, because the UI always reads live from the data store.

AT-04A (shipping info shown when present):
  Ashley Carter → My Orders → ORD-1001 shows carrier, tracking number,
  status, and estimated delivery.

AT-04B (no fabricated shipping info):
  Ashley Carter → My Orders → ORD-1002 shows "Not yet available" for
  shipping — no invented tracking number or date is displayed.

AT-04C (shipping reflects recorded changes):
  On ORD-1002, click "Simulate carrier update" (prototype testing
  control) — shipping information appears immediately and matches what
  was just recorded.

AT-04D (shipping is order-specific):
  Compare ORD-1001 (has shipping) and ORD-1002 (does not) for the same
  customer — each order's detail page shows only its own shipping data.

ACCESSIBILITY NOTES
--------------------
- Semantic landmarks: header/nav/main/footer; headings per screen.
- Every form control has a visible, associated <label>.
- All interactive elements are native <button>/<a>/<input>/<select>, so
  the whole app is operable by keyboard alone (Tab/Shift+Tab/Enter/Space).
- A "Skip to main content" link is provided for keyboard users.
- Focus moves to the new screen's heading on navigation.
- Validation errors are linked to fields via aria-describedby and
  aria-invalid, and focus moves to the first invalid field on submit.
- An aria-live region announces cart changes, search results, and order
  status changes for screen reader users.
- Color is never the only signal: badges use both an icon/symbol and text
  ("✔ Available", "✘ Out of stock", "⚠ Availability unknown").
- Text/background color pairs were chosen to meet WCAG AA contrast.

KNOWN LIMITATIONS / OUT OF SCOPE
----------------------------------
- No real authentication — the "Signed in as" control is a prototype
  stand-in for login, used only to demonstrate per-customer order access.
- No persistence — refreshing the page resets the cart, any newly placed
  orders, and any simulated shipping/availability changes back to the
  original synthetic data in data.js.
- Payment is entirely simulated in the browser (card number prefix
  4000 = decline, anything else well-formed = approve). No real payment
  network, PCI data, or external service is contacted.
- Only "Must have" (MoSCoW) scope from US-01 through US-04 is covered;
  all lower-priority stories/features are intentionally out of scope.
