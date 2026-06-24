# Luxe Liquid: Elegant Auto-Suggestion Search

An elegant, high-end e-commerce interface with an advanced, debounced **Auto-Suggestion Search** system. Designed with a luxury visual identity ("Luxe Liquid") featuring ambient glow filters, liquid glassmorphism, responsive grids, and an interactive shopping bag checkout experience.

*This project was actively vibecoded using Google Antigravity and Google Stitch for design of UI.*


---

## Visual Previews

Here you can showcase the elegant user interface of Luxe Liquid. Replace the placeholder links below with your screenshots.

### Search & Auto-Suggestions
*Experience real-time debounced results as you type with the luxury glassmorphic dropdown.*

![Search & Auto-Suggestions](./src/assets/screenshots/Search.png) 



### Product Catalog & Liquid Glass Navbar
*Browse through premium collections (Tech, Makeup, Groceries) styled with custom hover effects.*


 ![Homepage & Product Catalog](./src/assets/screenshots/Curated.png)



### Shopping Bag Drawer
*Manage your selected items, increment/decrement quantities, and check the real-time subtotal in the sliding side-drawer.*

*First- Without any items*
![Shopping Bag Drawer1](./src/assets/screenshots/Bag_no_item.png) 

*Next- With an item*
![Shopping Bag Drawer2](./src/assets/screenshots/bag_single_item.png) 

*Next- With multiple items*
![Shopping Bag Drawer3](./src/assets/screenshots/bag_multiple_item.png) 

### Editorial Section
*Reviews left by prominent customers.*
![Editorial](./src/assets/screenshots/editorial.png) 

### Collections
*Items categorised into various collections*

**Tech Collection**
![Tech](./src/assets/screenshots/collection_tech.png)

**Groceries collection**
![Groceries](./src/assets/screenshots/colection_groceries.png) 


## Features

- **Local MongoDB database & Node/Express API**: Connects to the local `productslog` database (for product catalogs) and `login` database (for authentication).
- **JWT-Based Role Authentication**: Features a luxury glassmorphic login gate to toggle access between User Access (Store Members) and Admin Portal. Verification is done securely using JSON Web Tokens (JWT) and `bcryptjs` password hashing.
- **Role-Based Access Control (RBAC)**: Exposes advanced admin capabilities (like the Restock Simulator panel) exclusively to logged-in Admins, while standard Users see only the basic catalog browsing, searching, and checkout views.
- **Session Persistence & Logout**: Stores tokens in browser `localStorage` to keep users logged in across page reloads. An interactive Logout button clears session tokens and returns the interface to the login wall.
- **Debounced Auto-Suggestion**: Searches the database with a 400ms debounce to limit API server queries.
- **Product Details Pages**: Clicking on any product navigates to a dedicated specifications page displaying all fields (description, dimensions, weight, shipping, warranty, returns, and reviews) while omitting `sku`, `id`, `stock`, `meta`, and `thumbnail`.
- **Checkout & Stock Reduction**: Processes shopping cart checkout by decrementing database stocks directly using MongoDB query operators.
- **Out-of-Stock Disabling**: Toggles `availabilityStatus` to `'Out of Stock'` automatically when stock reaches `0`, styling the "Add to Bag" buttons to be greyed out and unclickable.
- **Restock Simulation Control**: Toggles the restock simulator directly on detail pages (for Admins), allowing immediate addition of user-defined stock which toggles the item status back to `'In Stock'` and reenables the buttons.
- **Glassmorphic Navigation Bar**: Implements a sticky nav with background blur (`backdrop-filter`) and gold hover effects.
- **Collection Tabs**: Categorizes product catalog items dynamically into **Tech**, **Makeup**, and **Groceries** views.
- **Sliding Shopping Bag Drawer**: Sliding drawer to add, update quantity, remove items, and calculate the total price in real time.
- **Micro-Animations**: Clean, premium transitions on cards, buttons, input fields, and hover states.
- **Fully Responsive**: Optimized for desktop, tablet, and mobile views.

---

## Tech Stack

- **Frontend**: React 19 + Vite 8 (with React Compiler enabled for optimal rendering performance)
- **Backend API**: Node.js + Express.js (Port `5000`)
- **Authentication**: JSON Web Tokens (JWT) + `bcryptjs` encryption
- **Database**: MongoDB (Local instance `mongodb://127.0.0.1:27017` with connections to `productslog` and `login` databases)
- **Styling**: Vanilla CSS (variables, glassmorphic styles, custom utility classes)

---

## Getting Started

Follow these steps to run the application locally:

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Auto-suggestion-search.git
cd Auto-suggestion-search
```

### 2. Configure MongoDB
Ensure MongoDB is running locally on port `27017` with a database named `productslog` containing a `products` collection.
The application also connects to a `login` database. Upon first run, the backend server will automatically create the `login` database and seed it with two test accounts if they are not already present:
- **User**: `user@luxe.com` / `user123`
- **Admin**: `admin@luxe.com` / `admin123`

### 3. Run Backend API Server
Install backend dependencies and run the server:
```bash
npm run server
```
The backend server will run at `http://localhost:5000`.

### 4. Run Frontend App
In a separate terminal window, install frontend dependencies and start the dev server:
```bash
npm install
npm run dev
```
The application will be running at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

---

## 📂 Project Structure

```
Auto-suggestion-search/
├── backend/
│   ├── package.json            # Backend dependency setup
│   └── server.js               # Node/Express server connecting to MongoDB
├── src/
│   ├── components/
│   │   └── AutoSuggestion.jsx  # Main search & details page component
│   ├── assets/                 # Local assets, screenshots, and fonts
│   ├── App.jsx                 # App root component
│   ├── App.css                 # Page layout & drawer css styles
│   ├── index.css               # Design tokens, variables & base css
│   └── main.jsx                # Entry point
├── public/                     # Public assets
├── .gitignore                  # Git ignore files and directories
├── package.json                # Project dependencies and scripts
└── README.md                   # Project documentation
```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


