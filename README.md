# HausManager (Improved)

This folder contains an improved version of the **HausManager** project. The original
repository consisted of static HTML pages with placeholder data and a basic
landing page for the Merchant Haus portal. The goal of this exercise was to
audit the existing codebase and iteratively improve the user experience (UX)
and functionality while introducing a clean separation between the front‑end
and back‑end and preparing for integration with NMI’s payment API.

## Key Improvements

### 1. Express API server

* A simple Node/Express server (`server/server.js`) now powers all data
  interactions. The server exposes RESTful endpoints for products, orders,
  inventory, subscriptions and transactions. Each endpoint returns JSON
  allowing the front‑end to fetch data asynchronously.
* Sensitive credentials for the NMI gateway are no longer hard‑coded in the
  front‑end. Instead, they are loaded from environment variables via
  `dotenv`. See `.env.example` for the expected configuration.
* The `callNmiTransaction` helper demonstrates how to call NMI’s
  `transact.php` endpoint using the built‑in Node.js `fetch` API with
  `application/x-www-form-urlencoded` data and parses the gateway’s
  name/value response into a JavaScript object【868180669395722†L240-L300】.

* Additional endpoints now allow you to **refund** or **void** an existing
  transaction. POST to `/api/transactions/:id/refund` or
  `/api/transactions/:id/void` and the server will send a `type=refund` or
  `type=void` request to NMI’s `transact.php` endpoint. This mirrors the
  NMI guidance that voids, captures and refunds simply require the
  `transactionid` and transaction type【868180669395722†L524-L571】.

### 2. Dynamic, data‑driven UI

* All management pages (inventory, products, orders, subscriptions and
  transactions) have been rebuilt to load their content from the API. The
  static tables in the original repository have been replaced with empty table
  bodies (`<tbody id="…">`) that are populated at runtime by
  `public/assets/js/main.js`.
* The `main.js` module uses the native `fetch` API and ES modules to load
  data, handle user interactions and update the DOM. It detects which page is
  being viewed and calls the appropriate `load…()` function automatically.
* Search and filtering support was added on the Products page. Typing in the
  search box triggers a request to `/api/products?search=query` on the
  server, returning only matching products.
* Adding new products and subscriptions is now possible from the UI. Clicking
  the “Add Product” or “New Subscription” buttons prompts the user for
  details, posts the new record to the API and refreshes the table without
  reloading the page.
* Orders include a “View” button. Clicking it performs an AJAX request to
  `/api/transactions/:id` and displays the transaction status. If the
  transaction exists only in NMI’s gateway the server will attempt to query
  `transact.php` with `type=query` and return the parsed response.

* The Orders page now has a **New Order** button. It prompts the user for
  customer details, amount and a payment token then posts to `/api/orders`.
  The API triggers a sale transaction against NMI and adds the new order and
  transaction to the in‑memory data store. This demonstrates full round‑trip
  payment processing using the NMI Payment API.

* The Transactions page has been enhanced with **View** and **Refund**
  actions. For approved transactions a Refund button appears. Clicking
  Refund calls the new refund endpoint which sends a `type=refund` request
  to NMI and updates the table accordingly.

### 3. Visual polish and branding

* A modern Tailwind‑based design has been preserved from the original but
  cleaned up for consistency. The sidebar navigation highlights the current
  section and uses a generated logo (`assets/images/logo.png`) instead of a
  broken reference.
* The sign‑in page has been simplified. Instead of a two‑step demo login it
  collects an email and password, performs basic validation and redirects
  directly to the orders page. The page retains the colourful glow effects of
  the original for a premium feel.

## Running the project

1. Install Node.js if it isn’t already installed. This project does not
   require any global dependencies.
2. Copy `.env.example` to `.env` inside the `server` folder and fill in your
   NMI credentials (`NMI_SECURITY_KEY`, `NMI_PARTNER_KEY` and `NMI_BASE_URL`).
3. Inside the `server` directory, install the dependencies and start the
   server:

   ```bash
   cd server
   npm install
   npm start
   ```

   The API will be served on `http://localhost:3001` by default. You can
   change the port by setting `PORT` in your `.env` file.

4. Open the pages in the `public` folder in your browser. For example,
   navigate to `public/index.html` to sign in. The pages will make requests to
   the API running on the same host. If you are serving the HTML from a
   different origin you may need to adjust the base URL in
   `public/assets/js/main.js`.

## Next steps / further improvements

This improved version lays the foundation for a fully integrated Merchant Haus
application. In this third pass we added transaction management features
including order creation and refunds. Further enhancements could include:

* Persisting data using a proper database (e.g. PostgreSQL) instead of
  in‑memory arrays.
* Implementing authentication and role‑based access control on the server.
* Building React or Vue components to manage state more cleanly on the
  front‑end.
* Consuming additional NMI API endpoints such as the Customer Vault and
  recurring billing features and surfacing them in the UI. The NMI
  documentation on `transact.php` notes that transactions can be processed
  asynchronously or synchronously and lists many optional parameters such as
  `verification_method` and `dynamic_descriptor`【868180669395722†L240-L458】—these should be
  surfaced in a production application.

We hope these improvements make HausManager easier to extend and a more
realistic foundation for integrating with NMI’s platform.