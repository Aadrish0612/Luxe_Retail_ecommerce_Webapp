/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';

async function fetchProducts(query) {
    const url = query.trim().length > 0 
        ? `http://localhost:5000/api/products?q=${query}`
        : 'http://localhost:5000/api/products';
    const res = await fetch(url);
    const data = await res.json();
    return data;
}

const AutoSuggestion = () => {
    // Authentication States
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(() => !!localStorage.getItem('luxe_liquid_token'));
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginRole, setLoginRole] = useState("user");
    const [loginError, setLoginError] = useState("");
    const [loginSubmitting, setLoginSubmitting] = useState(false);

    // Registration States
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [registerFirstName, setRegisterFirstName] = useState("");
    const [registerLastName, setRegisterLastName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");

    // Admin Creation States
    const [adminFirstName, setAdminFirstName] = useState("");
    const [adminLastName, setAdminLastName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminCreationLoading, setAdminCreationLoading] = useState(false);

    // Admin Dashboard States
    const [adminTab, setAdminTab] = useState("catalog");
    const [accountsList, setAccountsList] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [pressQuotes, setPressQuotes] = useState([]);
   
    // Form state for creating/editing a product
    const [editingProduct, setEditingProduct] = useState(null);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [formProductTitle, setFormProductTitle] = useState("");
    const [formProductDesc, setFormProductDesc] = useState("");
    const [formProductPrice, setFormProductPrice] = useState(0);
    const [formProductDiscount, setFormProductDiscount] = useState(0);
    const [formProductStock, setFormProductStock] = useState(0);
    const [formProductBrand, setFormProductBrand] = useState("");
    const [formProductCategory, setFormProductCategory] = useState("beauty");
    const [formProductTags, setFormProductTags] = useState("");

    // Press Quote Form States
    const [pressSource, setPressSource] = useState("");
    const [pressQuote, setPressQuote] = useState("");

    const [inputValue, setInputValue] = useState("");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDropdownActive, setIsDropdownActive] = useState(false);
    
    // Page View Navigation ('store' | 'collections' | 'editorial' | 'bespoke' | 'product-detail')
    const [view, setView] = useState("store");
    
    // Collections Tabs ('tech' | 'makeup' | 'groceries')
    const [activeCollectionTab, setActiveCollectionTab] = useState("tech");
    const [collectionProducts, setCollectionProducts] = useState([]);
    const [collectionLoading, setCollectionLoading] = useState(false);
    
    // Shopping Bag States
    const [bagItems, setBagItems] = useState([]);
    const [isBagOpen, setIsBagOpen] = useState(false);
    
    // Detailed Product States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    
    // Review form states
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);


    const navigateToProduct = (product) => {
        setSelectedProduct(product);
        setActiveImageIndex(0);
        setView('product-detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Verify JWT token on mount
    useEffect(() => {
        const token = localStorage.getItem('luxe_liquid_token');
        if (token) {
            fetch('http://localhost:5000/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Invalid token');
            })
            .then(data => {
                if (data.success) {
                    setCurrentUser({
                        email: data.user.email,
                        role: data.user.role,
                        token: token
                    });
                } else {
                    localStorage.removeItem('luxe_liquid_token');
                }
            })
            .catch(() => {
                localStorage.removeItem('luxe_liquid_token');
            })
            .finally(() => {
                setAuthLoading(false);
            });
        }
    }, []);

    // Handle Login Action
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                    role: loginRole
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                localStorage.setItem('luxe_liquid_token', data.token);
                setCurrentUser({
                    email: data.user.email,
                    role: data.user.role,
                    token: data.token
                });
                setLoginEmail("");
                setLoginPassword("");
                setLoginError("");
            } else {
                setLoginError(data.error || 'Authentication failed. Please check your credentials.');
            }
        } catch (err) {
            console.error("Login error:", err);
            setLoginError("Connection error. Is the server running?");
        } finally {
            setLoginSubmitting(false);
        }
    };

    // Handle Register Action
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginSubmitting(true);
        
        if (!registerFirstName.trim() || !registerLastName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
            setLoginError("All registration fields are required.");
            setLoginSubmitting(false);
            return;
        }
        
        try {
            const res = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: registerEmail,
                    password: registerPassword,
                    firstName: registerFirstName,
                    lastName: registerLastName
                })
            });
            
            const data = await res.json();
            if (res.ok && data.success && data.token) {
                localStorage.setItem('luxe_liquid_token', data.token);
                setCurrentUser({
                    email: data.user.email,
                    role: data.user.role,
                    token: data.token
                });
                setRegisterFirstName("");
                setRegisterLastName("");
                setRegisterEmail("");
                setRegisterPassword("");
                setIsRegisterMode(false);
            } else {
                setLoginError(data.error || "Registration failed.");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setLoginError("Network connection error during registration.");
        } finally {
            setLoginSubmitting(false);
        }
    };

    // Handle Admin Creation Action
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (!adminFirstName.trim() || !adminLastName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
            alert("All fields are required to create an administrator.");
            return;
        }
        
        try {
            setAdminCreationLoading(true);
            const token = localStorage.getItem('luxe_liquid_token');
            const res = await fetch("http://localhost:5000/api/accounts/admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: adminEmail,
                    password: adminPassword,
                    firstName: adminFirstName,
                    lastName: adminLastName
                })
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message || "Admin account created successfully!");
                setAdminFirstName("");
                setAdminLastName("");
                setAdminEmail("");
                setAdminPassword("");
                fetchAccounts();
            } else {
                alert(data.error || "Failed to create administrator account.");
            }
        } catch (err) {
            console.error("Error creating admin account:", err);
            alert("Network error occurred while creating admin account.");
        } finally {
            setAdminCreationLoading(false);
        }
    };

    // Sync cart to backend database for abandonment tracking
    useEffect(() => {
        if (currentUser && currentUser.email) {
            fetch('http://localhost:5000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentUser.email,
                    items: bagItems.map(item => ({
                        id: item.id,
                        title: item.title,
                        quantity: item.quantity,
                        price: item.price,
                        thumbnail: item.thumbnail
                    }))
                })
            }).catch(err => console.error("Error syncing cart:", err));
        }
    }, [bagItems, currentUser]);

    // Fetch press quotes
    const loadPressQuotes = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/editorial/press');
            const data = await res.json();
            setPressQuotes(data.quotes || []);
        } catch (err) {
            console.error("Error loading press quotes:", err);
        }
    };

    // Trigger fetching when admin view or editorial is active
    useEffect(() => {
        if (view === 'editorial') {
            loadPressQuotes();
        }
    }, [view]);

    // Admin state fetches
    const fetchAccounts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/accounts');
            const data = await res.json();
            setAccountsList(data.accounts || []);
        } catch (err) {
            console.error("Error fetching accounts:", err);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/analytics/dashboard');
            const data = await res.json();
            setAnalyticsData(data);
        } catch (err) {
            console.error("Error fetching analytics:", err);
        }
    };

    const fetchAbandonedCarts = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/analytics/abandonment?email=${currentUser?.email}`);
            const data = await res.json();
            setAbandonedCarts(data.carts || []);
        } catch (err) {
            console.error("Error fetching abandoned carts:", err);
        }
    };

    useEffect(() => {
        if (view === 'admin-dashboard') {
            if (adminTab === 'catalog') {
                fetchProducts(inputValue || query || "").then(data => setResults(data.products || []));
            }
            if (adminTab === 'accounts') fetchAccounts();
            if (adminTab === 'analytics') {
                fetchAnalytics();
                fetchAbandonedCarts();
            }
            if (adminTab === 'moderation') {
                loadPressQuotes();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, adminTab]);

    const handleOpenEdit = (p) => {
        setEditingProduct(p);
        setIsCreatingProduct(false);
        setFormProductTitle(p.title);
        setFormProductDesc(p.description || "");
        setFormProductPrice(p.price);
        setFormProductDiscount(p.discountPercentage || 0);
        setFormProductStock(p.stock);
        setFormProductBrand(p.brand || "");
        setFormProductCategory(p.category);
        setFormProductTags(p.tags ? p.tags.join(", ") : "");
    };

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setIsCreatingProduct(true);
        setFormProductTitle("");
        setFormProductDesc("");
        setFormProductPrice(10);
        setFormProductDiscount(0);
        setFormProductStock(5);
        setFormProductBrand("");
        setFormProductCategory("beauty");
        setFormProductTags("curated");
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const parsedTags = formProductTags.split(",").map(t => t.trim()).filter(Boolean);
        const payload = {
            title: formProductTitle,
            description: formProductDesc,
            price: Number(formProductPrice),
            discountPercentage: Number(formProductDiscount),
            stock: Number(formProductStock),
            brand: formProductBrand,
            category: formProductCategory,
            tags: parsedTags
        };

        const url = isCreatingProduct 
            ? 'http://localhost:5000/api/products'
            : `http://localhost:5000/api/products/${editingProduct.id}`;
        const method = isCreatingProduct ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(isCreatingProduct ? 'Product created!' : 'Product updated!');
                setEditingProduct(null);
                setIsCreatingProduct(false);
                const refreshed = await fetchProducts(inputValue || query || "");
                setResults(refreshed.products || []);
            } else {
                alert(`Failed: ${data.error}`);
            }
        } catch (err) {
            console.error("Save product failed:", err);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product? This action is irreversible.")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("Product deleted!");
                const refreshed = await fetchProducts(inputValue || query || "");
                setResults(refreshed.products || []);
            } else {
                alert(`Delete failed: ${data.error}`);
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleToggleReviewVerified = async (productId, reviewIdx, currentVerified) => {
        try {
            const res = await fetch(`http://localhost:5000/api/products/${productId}/reviews/${reviewIdx}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: !currentVerified })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const refreshed = await fetchProducts(inputValue || query || "");
                setResults(refreshed.products || []);
                if (selectedProduct && selectedProduct.id === productId) {
                    setSelectedProduct(prev => ({ ...prev, reviews: data.reviews }));
                }
            } else {
                alert("Failed to update review status");
            }
        } catch (err) {
            console.error("Error updating review:", err);
        }
    };

    const handleToggleReviewHidden = async (productId, reviewIdx, currentHidden) => {
        try {
            const res = await fetch(`http://localhost:5000/api/products/${productId}/reviews/${reviewIdx}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hidden: !currentHidden })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const refreshed = await fetchProducts(inputValue || query || "");
                setResults(refreshed.products || []);
                if (selectedProduct && selectedProduct.id === productId) {
                    setSelectedProduct(prev => ({ ...prev, reviews: data.reviews }));
                }
            } else {
                alert("Failed to hide review");
            }
        } catch (err) {
            console.error("Error updating review visibility:", err);
        }
    };

    const handleDeleteReview = async (productId, reviewIdx) => {
        if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
        try {
            const token = localStorage.getItem('luxe_liquid_token');
            const res = await fetch(`http://localhost:5000/api/products/${productId}/reviews/${reviewIdx}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const refreshed = await fetchProducts(inputValue || query || "");
                setResults(refreshed.products || []);
                if (selectedProduct && selectedProduct.id === productId) {
                    setSelectedProduct(prev => ({
                        ...prev,
                        reviews: data.reviews,
                        rating: data.rating
                    }));
                }
            } else {
                alert(`Failed to delete review: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error deleting review:", err);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        if (!reviewComment.trim()) {
            alert("Please enter your comment.");
            return;
        }
        
        try {
            setReviewSubmitting(true);
            const token = localStorage.getItem('luxe_liquid_token');
            const reviewerEmail = currentUser?.email || 'anonymous@luxe.com';
            const reviewerName = reviewerEmail.split('@')[0];

            const res = await fetch(`http://localhost:5000/api/products/${selectedProduct.id}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: reviewRating,
                    comment: reviewComment,
                    reviewerName: reviewerName,
                    reviewerEmail: reviewerEmail
                })
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                setReviewComment("");
                setReviewRating(5);
                const refreshed = await fetchProducts(inputValue || query || "");
                setResults(refreshed.products || []);
                setSelectedProduct(prev => ({
                    ...prev,
                    reviews: data.reviews,
                    rating: data.rating
                }));
            } else {
                alert(`Failed to submit review: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error submitting review:", err);
        } finally {
            setReviewSubmitting(false);
        }
    };


    const handleAddPressQuote = async (e) => {
        e.preventDefault();
        if (!pressSource || !pressQuote) return;
        try {
            const res = await fetch('http://localhost:5000/api/editorial/press', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: pressSource, quote: pressQuote })
            });
            if (res.ok) {
                setPressSource("");
                setPressQuote("");
                loadPressQuotes();
            } else {
                alert("Failed to add quote");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePressQuote = async (quoteId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/editorial/press/${quoteId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                loadPressQuotes();
            } else {
                alert("Failed to delete quote");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleUserRole = async (email, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Are you sure you want to change role of ${email} to ${newRole}?`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/accounts/${email}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("Account role updated successfully!");
                fetchAccounts();
            } else {
                alert(`Failed to update role: ${data.error}`);
            }
        } catch (err) {
            console.error("Error changing role:", err);
        }
    };
    
    const timerIdRef = useRef();
    const dropdownRef = useRef();

    // Helper to categorize products under Tech, Makeup, or Groceries
    const getProductCollection = (product) => {
        const cat = (product.category || "").toLowerCase();
        if (['smartphones', 'laptops', 'tablets', 'mobile-accessories', 'electronics', 'laptops-and-computers', 'tech'].includes(cat)) {
            return 'tech';
        }
        if (['beauty', 'fragrances', 'skin-care', 'cosmetics', 'face-cream'].includes(cat)) {
            return 'makeup';
        }
        if (['groceries'].includes(cat)) {
            return 'groceries';
        }
        return null;
    };

    // Fetch initial products or search results when query changes
    useEffect(() => {
        async function makeApiCall() {
            setLoading(true);
            try {
                const data = await fetchProducts(query);
                setResults(data.products || []);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }
        makeApiCall();
    }, [query]);

    // Fetch collection specific products from dummyJSON when Collections tab is selected
    useEffect(() => {
        if (view === 'collections') {
            async function loadCollection() {
                setCollectionLoading(true);
                try {
                    let categoryEndpoint = '';
                    if (activeCollectionTab === 'tech') {
                        categoryEndpoint = 'laptops';
                    } else if (activeCollectionTab === 'makeup') {
                        categoryEndpoint = 'beauty';
                    } else if (activeCollectionTab === 'groceries') {
                        categoryEndpoint = 'groceries';
                    }
                    
                    const res = await fetch(`http://localhost:5000/api/products/category/${categoryEndpoint}`);
                    const data = await res.json();
                    setCollectionProducts(data.products || []);
                } catch (error) {
                    console.error("Error loading collection category:", error);
                } finally {
                    setCollectionLoading(false);
                }
            }
            loadCollection();
        }
    }, [view, activeCollectionTab]);

    // Handle clicks outside the search dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownActive(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const inputChangeHandler = (event) => {
        const val = event.target.value;
        setInputValue(val);
        
        // If they are on Editorial or Bespoke, switch them to Store to display results
        if (view === 'editorial' || view === 'bespoke') {
            setView('store');
        }
        
        clearTimeout(timerIdRef.current);
        timerIdRef.current = setTimeout(() => {
            setQuery(val);
        }, 400); // 400ms debounce
    };

    const handleFocus = () => {
        if (results.length > 0) {
            setIsDropdownActive(true);
        }
    };

    const handleSuggestionClick = (productTitle) => {
        setInputValue(productTitle);
        setQuery(productTitle);
        setIsDropdownActive(false);
        if (view === 'editorial' || view === 'bespoke') {
            setView('store');
        }
    };

    const selectTagType = (price, rating) => {
        if (price > 500) return { label: "Premium Gold", className: "exclusive" };
        if (rating > 4.7) return { label: "Limited Edition", className: "exclusive" };
        return { label: "Curated", className: "" };
    };

    // Shopping Bag Handlers
    const addToBag = (product) => {
        setBagItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id);
            if (existingItem) {
                return prevItems.map((item) => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
        setIsBagOpen(true); // Auto-open bag drawer on addition
    };

    const removeFromBag = (productId) => {
        setBagItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setBagItems((prevItems) => {
            return prevItems.map((item) => {
                if (item.id === productId) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean);
        });
    };

    const calculateTotal = () => {
        const total = bagItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return total.toFixed(2);
    };

    const handleCheckout = async () => {
        try {
            const checkoutItems = bagItems.map(item => ({
                id: item.id,
                quantity: item.quantity
            }));
            
            const res = await fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    items: checkoutItems,
                    email: currentUser?.email
                })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                alert(`Checkout successful! Total: $${calculateTotal()}`);
                setBagItems([]);
                setIsBagOpen(false);
                
                // Refresh list to pull updated stock values from local database
                const refreshed = await fetchProducts(inputValue || query || "");
                setResults(refreshed.products || []);
            } else {
                alert(`Checkout failed: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error during checkout:', err);
            alert('Checkout failed due to network error.');
        }
    };

    const totalBagQty = bagItems.reduce((acc, item) => acc + item.quantity, 0);

    // Calculate displayed products under Collections
    const getDisplayedCollectionProducts = () => {
        if (query.trim().length > 0) {
            // Filter user search results
            return results.filter(product => getProductCollection(product) === activeCollectionTab);
        }
        // Show general fetched products for this collection
        return collectionProducts;
    };

    const displayedCollectionProducts = getDisplayedCollectionProducts();

    if (authLoading) {
        return (
            <div className="state-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', border: '4px solid rgba(var(--primary-gold-rgb), 0.1)', borderTop: '4px solid var(--primary-gold)', borderRadius: '50%' }}></div>
                <h3 className="text-headline-md state-title" style={{ marginTop: '24px' }}>Authenticating Session</h3>
                <p className="text-body-md state-description">Verifying credentials and preparing the luxury interface...</p>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <span className="login-logo-dot"></span>
                        <h2 className="login-logo-text">Luxe Liquid</h2>
                        <p className="login-subtitle">Fine Spirits & Curations</p>
                    </div>
                    
                    {!isRegisterMode && (
                        <div className="role-tabs">
                            <button 
                                type="button" 
                                className={`role-tab-btn ${loginRole === 'user' ? 'active' : ''}`}
                                onClick={() => { setLoginRole('user'); setLoginError(''); }}
                            >
                                User Access
                            </button>
                            <button 
                                type="button" 
                                className={`role-tab-btn ${loginRole === 'admin' ? 'active' : ''}`}
                                onClick={() => { setLoginRole('admin'); setLoginError(''); }}
                            >
                                Admin Portal
                            </button>
                        </div>
                    )}

                    {isRegisterMode ? (
                        <form className="login-form" onSubmit={handleRegister}>
                            {loginError && (
                                <div className="login-error-alert">
                                    <span className="error-icon">⚠</span>
                                    <span className="error-text">{loginError}</span>
                                </div>
                            )}

                            <div className="form-grid-names" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="register-firstname">First Name</label>
                                    <input 
                                        id="register-firstname"
                                        type="text"
                                        className="form-input"
                                        value={registerFirstName}
                                        onChange={(e) => setRegisterFirstName(e.target.value)}
                                        placeholder="e.g. John"
                                        required
                                        disabled={loginSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="register-lastname">Last Name</label>
                                    <input 
                                        id="register-lastname"
                                        type="text"
                                        className="form-input"
                                        value={registerLastName}
                                        onChange={(e) => setRegisterLastName(e.target.value)}
                                        placeholder="e.g. Doe"
                                        required
                                        disabled={loginSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '12px' }}>
                                <label className="form-label" htmlFor="register-email">Email Address</label>
                                <input 
                                    id="register-email"
                                    type="email"
                                    className="form-input"
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                    placeholder="e.g. name@luxe.com"
                                    required
                                    disabled={loginSubmitting}
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: '12px' }}>
                                <label className="form-label" htmlFor="register-password">Password</label>
                                <input 
                                    id="register-password"
                                    type="password"
                                    className="form-input"
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                    placeholder="Create password"
                                    required
                                    disabled={loginSubmitting}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary btn-login-submit"
                                style={{ marginTop: '16px' }}
                                disabled={loginSubmitting}
                            >
                                {loginSubmitting ? 'Registering...' : 'Register'}
                            </button>

                            <div className="auth-toggle-row" style={{ textAlign: 'center', marginTop: '16px' }}>
                                <span style={{ fontSize: '13px', opacity: 0.7 }}>Already have an account? </span>
                                <button 
                                    type="button" 
                                    className="btn-link-toggle"
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                                    onClick={() => { setIsRegisterMode(false); setLoginError(''); }}
                                >
                                    Sign In
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="login-form" onSubmit={handleLogin}>
                            {loginError && (
                                <div className="login-error-alert">
                                    <span className="error-icon">⚠</span>
                                    <span className="error-text">{loginError}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label" htmlFor="login-email">Email Address</label>
                                <input 
                                    id="login-email"
                                    type="email"
                                    className="form-input"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    placeholder="e.g. name@luxe.com"
                                    required
                                    disabled={loginSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="login-password">Password</label>
                                <input 
                                    id="login-password"
                                    type="password"
                                    className="form-input"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                    disabled={loginSubmitting}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary btn-login-submit"
                                disabled={loginSubmitting}
                            >
                                {loginSubmitting ? 'Verifying...' : 'Authenticate'}
                            </button>

                            <div className="auth-toggle-row" style={{ textAlign: 'center', marginTop: '16px' }}>
                                <span style={{ fontSize: '13px', opacity: 0.7 }}>Don't have an account? </span>
                                <button 
                                    type="button" 
                                    className="btn-link-toggle"
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                                    onClick={() => { setIsRegisterMode(true); setLoginError(''); }}
                                >
                                    Create one
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <section>
            {/* Liquid Glass Navigation Bar */}
            <nav className="liquid-glass-nav">
                <span className="nav-logo" onClick={() => setView('store')} style={{ cursor: 'pointer' }}>
                    <span className="nav-logo-dot"></span>
                    Luxe Liquid
                </span>
                
                <ul className="nav-links" style={{ display: 'flex' }}>
                    <li>
                        <span 
                            className={`nav-link ${view === 'store' ? 'active' : ''}`}
                            onClick={() => setView('store')}
                            style={{ cursor: 'pointer' }}
                        >
                            Store
                        </span>
                    </li>
                    <li>
                        <span 
                            className={`nav-link ${view === 'collections' ? 'active' : ''}`}
                            onClick={() => setView('collections')}
                            style={{ cursor: 'pointer' }}
                        >
                            Collections
                        </span>
                    </li>
                    <li>
                        <span 
                            className={`nav-link ${view === 'editorial' ? 'active' : ''}`}
                            onClick={() => setView('editorial')}
                            style={{ cursor: 'pointer' }}
                        >
                            Editorial
                        </span>
                    </li>
                    {currentUser?.role === 'admin' && (
                        <li>
                            <span 
                                className={`nav-link ${view === 'admin-dashboard' ? 'active' : ''}`}
                                onClick={() => setView('admin-dashboard')}
                                style={{ cursor: 'pointer', color: 'var(--primary-gold)' }}
                            >
                                Admin Panel
                            </span>
                        </li>
                    )}
                </ul>

                <div className="nav-actions">
                    <div className="search-wrapper" ref={dropdownRef}>
                        <div className="search-input-container">
                            <span className="search-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </span>
                            <input 
                                value={inputValue}
                                onChange={inputChangeHandler} 
                                onFocus={handleFocus}
                                className="search-input"
                                type="text" 
                                placeholder='Search Curated Goods...' 
                            />
                            {(loading || collectionLoading) && (
                                <span className="search-icon" style={{ left: 'auto', right: '14px' }}>
                                    <svg className="spinner" width="16" height="16" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
                                        <circle cx="25" cy="25" r="20" fill="none" stroke="var(--primary-gold)" strokeWidth="5" strokeDasharray="80 200" strokeDashoffset="0"></circle>
                                    </svg>
                                </span>
                            )}
                        </div>

                        {/* Auto Suggestion Dropdown */}
                        <div className={`suggestions-dropdown ${isDropdownActive && results.length > 0 ? 'active' : ''}`}>
                            <div className="dropdown-header">
                                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Quick Suggestions</span>
                            </div>
                            {results.slice(0, 5).map((product) => (
                                <div 
                                    key={product.id} 
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(product.title)}
                                >
                                    <img src={product.thumbnail} alt={product.title} className="suggestion-img" />
                                    <div className="suggestion-info">
                                        <span className="suggestion-title">{product.title}</span>
                                        <span className="suggestion-category">{product.category}</span>
                                    </div>
                                    <span className="suggestion-price">${product.price}</span>
                                </div>
                            ))}
                            <div className="dropdown-footer">
                                <span className="view-all-link" onClick={() => setIsDropdownActive(false)}>Close Suggestions</span>
                            </div>
                        </div>
                    </div>

                    {/* Active User Status & Logout */}
                    {currentUser && (
                        <div className="nav-profile-block">
                            <div className="profile-info">
                                <span className="profile-email">{currentUser.email}</span>
                                <span className={`profile-role ${currentUser.role}`}>
                                    {currentUser.role === 'admin' ? 'Admin Portal' : 'Member'}
                                </span>
                            </div>
                            <button 
                                className="btn-logout"
                                onClick={() => {
                                    localStorage.removeItem('luxe_liquid_token');
                                    setCurrentUser(null);
                                    setView('store');
                                    setBagItems([]);
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}

                    {/* Navigation Bag Button */}
                    <button className="nav-bag-btn" onClick={() => setIsBagOpen(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <span>Bag</span>
                        {totalBagQty > 0 && <span className="bag-badge">{totalBagQty}</span>}
                    </button>
                </div>
            </nav>

            {/* STORE VIEW */}
            {view === 'store' && (
                <>
                    {/* Hero Brand Section */}
                    <div className="hero-section">
                        <span className="text-label-md hero-subtitle">The Liquid Glass Collection</span>
                        <h1 className="text-display-lg hero-title">Luxe Liquid Retail</h1>
                        <p className="text-body-lg hero-description">
                            An atmosphere of exclusive luxury and tactile refinement. Discover premium goods meticulously crafted for discerning tastes, framed in soft depth and glowing accents.
                        </p>
                    </div>

                    {/* Main Products Area */}
                    <div className="products-section">
                        <div className="section-header">
                            <h2 className="text-headline-md section-title">
                                {query.trim().length > 0 ? `Results for "${query}"` : 'Curated Essentials'}
                            </h2>
                            <span className="text-label-sm results-count">
                                {results.length} item{results.length !== 1 ? 's' : ''} available
                            </span>
                        </div>

                        {loading && results.length === 0 ? (
                            <div className="state-container">
                                <div className="spinner" style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', border: '4px solid rgba(var(--primary-gold-rgb), 0.1)', borderTop: '4px solid var(--primary-gold)', borderRadius: '50%' }}></div>
                                <h3 className="text-headline-md state-title" style={{ marginTop: '24px' }}>Loading Collection</h3>
                                <p className="text-body-md state-description">Refining the catalogue for you...</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="state-container">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-outline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                                <h3 className="text-headline-md state-title">No Curations Found</h3>
                                <p className="text-body-md state-description">We couldn't find any products matching "{query}". Try refinement or searching another term.</p>
                            </div>
                        ) : (
                            <div className="product-grid">
                                {results.map((product) => {
                                    const tag = selectTagType(product.price, product.rating);
                                    return (
                                        <div key={product.id} className="product-card" onClick={() => navigateToProduct(product)}>
                                            <div className="product-image-container">
                                                <span className={`text-label-sm card-tag ${tag.className}`}>
                                                    {tag.label}
                                                </span>
                                                <img 
                                                    src={product.thumbnail} 
                                                    alt={product.title} 
                                                    className="product-image"
                                                    loading="lazy" 
                                                />
                                            </div>
                                            <div className="product-card-details">
                                                <span className="text-label-sm product-card-category">{product.category}</span>
                                                <h3 className="product-card-title">{product.title}</h3>
                                                <div className="product-card-meta">
                                                    <span className="product-card-price">${product.price}</span>
                                                    <button 
                                                        className="btn-primary"
                                                        disabled={product.stock === 0 || product.availabilityStatus === 'Out of Stock'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToBag(product);
                                                        }}
                                                        style={(product.stock === 0 || product.availabilityStatus === 'Out of Stock') ? { opacity: 0.5, cursor: 'not-allowed', background: '#444', color: '#888', boxShadow: 'none' } : {}}
                                                    >
                                                        {product.stock === 0 || product.availabilityStatus === 'Out of Stock' ? 'Out of Stock' : 'Add to Bag'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* COLLECTIONS VIEW */}
            {view === 'collections' && (
                <>
                    <div className="hero-section" style={{ marginBottom: '40px' }}>
                        <span className="text-label-md hero-subtitle">Hand-picked Curation</span>
                        <h1 className="text-display-lg hero-title">The Collections</h1>
                        <p className="text-body-lg hero-description">
                            Explore specialized curations built to streamline luxury discovery. Seamlessly transition between categories.
                        </p>
                    </div>

                    {/* Secondary Navigation Tabs */}
                    <div className="collections-tabs-container">
                        <button 
                            className={`collection-tab-btn ${activeCollectionTab === 'tech' ? 'active' : ''}`}
                            onClick={() => setActiveCollectionTab('tech')}
                        >
                            Tech
                        </button>
                        <button 
                            className={`collection-tab-btn ${activeCollectionTab === 'makeup' ? 'active' : ''}`}
                            onClick={() => setActiveCollectionTab('makeup')}
                        >
                            Makeup
                        </button>
                        <button 
                            className={`collection-tab-btn ${activeCollectionTab === 'groceries' ? 'active' : ''}`}
                            onClick={() => setActiveCollectionTab('groceries')}
                        >
                            Groceries
                        </button>
                    </div>

                    <div className="products-section">
                        <div className="section-header">
                            <h2 className="text-headline-md section-title" style={{ textTransform: 'capitalize' }}>
                                {activeCollectionTab} Collection {query.trim().length > 0 ? `Filtered by "${query}"` : ''}
                            </h2>
                            <span className="text-label-sm results-count">
                                {displayedCollectionProducts.length} item{displayedCollectionProducts.length !== 1 ? 's' : ''} available
                            </span>
                        </div>

                        {collectionLoading ? (
                            <div className="state-container">
                                <div className="spinner" style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', border: '4px solid rgba(var(--primary-gold-rgb), 0.1)', borderTop: '4px solid var(--primary-gold)', borderRadius: '50%' }}></div>
                                <h3 className="text-headline-md state-title" style={{ marginTop: '24px' }}>Compiling Category</h3>
                                <p className="text-body-md state-description">Refining collection display...</p>
                            </div>
                        ) : displayedCollectionProducts.length === 0 ? (
                            <div className="state-container">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-outline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                                <h3 className="text-headline-md state-title">No matching goods found</h3>
                                <p className="text-body-md state-description">
                                    We couldn't find any {activeCollectionTab} products in the loaded results. Try changing your search query or clear it.
                                </p>
                            </div>
                        ) : (
                            <div className="product-grid">
                                {displayedCollectionProducts.map((product) => {
                                    const tag = selectTagType(product.price, product.rating);
                                    return (
                                        <div key={product.id} className="product-card" onClick={() => navigateToProduct(product)}>
                                            <div className="product-image-container">
                                                <span className={`text-label-sm card-tag ${tag.className}`}>
                                                    {tag.label}
                                                </span>
                                                {product.stock > 0 && product.stock < 5 && (
                                                    <span className="stock-alert-badge">
                                                        Low Stock: {product.stock} Left
                                                    </span>
                                                )}
                                                <img 
                                                    src={product.thumbnail} 
                                                    alt={product.title} 
                                                    className="product-image"
                                                    loading="lazy" 
                                                />
                                            </div>
                                            <div className="product-card-details">
                                                <span className="text-label-sm product-card-category">{product.category}</span>
                                                <h3 className="product-card-title">{product.title}</h3>
                                                <div className="product-card-meta">
                                                    <div className="product-card-price-group">
                                                        {product.discountPercentage > 0 ? (
                                                            <>
                                                                <span className="product-card-price-discounted">
                                                                    ${(product.price * (1 - product.discountPercentage / 100)).toFixed(2)}
                                                                </span>
                                                                <span className="product-card-price-original">
                                                                    ${product.price}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="product-card-price">${product.price}</span>
                                                        )}
                                                    </div>
                                                    <button 
                                                        className="btn-primary"
                                                        disabled={product.stock === 0 || product.availabilityStatus === 'Out of Stock'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToBag(product);
                                                        }}
                                                        style={(product.stock === 0 || product.availabilityStatus === 'Out of Stock') ? { opacity: 0.5, cursor: 'not-allowed', background: '#444', color: '#888', boxShadow: 'none' } : {}}
                                                    >
                                                        {product.stock === 0 || product.availabilityStatus === 'Out of Stock' ? 'Out of Stock' : 'Add to Bag'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* EDITORIAL VIEW */}
            {view === 'editorial' && (
                <div className="editorial-container">
                    <div className="hero-section">
                        <span className="text-label-md hero-subtitle">The Press & Reviews</span>
                        <h1 className="text-display-lg hero-title">Luxe Liquid Editorial</h1>
                        <p className="text-body-lg hero-description">
                            What the world is saying about Luxe Liquid Retail. High-fashion curations meets cutting-edge digital experiences.
                        </p>
                    </div>

                    {/* Dynamic News Outlets Grid */}
                    <div className="editorial-grid">
                        {pressQuotes.map(q => (
                            <div key={q._id || q.source} className="editorial-card">
                                <span className="editorial-quote-mark">“</span>
                                <p className="editorial-quote">{q.quote}</p>
                                <div className="editorial-source">{q.source}</div>
                            </div>
                        ))}
                        {pressQuotes.length === 0 && (
                            <p className="text-dim text-center" style={{ gridColumn: 'span 2' }}>No critiques published yet.</p>
                        )}
                    </div>

                    {/* Reviewers List */}
                    <div className="reviewers-section">
                        <h2 className="text-headline-md reviewers-title">Expert Critiques</h2>
                        <div className="reviewers-list">
                            <div className="reviewer-card">
                                <p className="reviewer-comment">
                                    "The curation of beauty items is unmatched. Each product feels like a hand-picked treasure."
                                </p>
                                <div className="reviewer-meta">
                                    <div className="reviewer-avatar">CM</div>
                                    <div className="reviewer-name-container">
                                        <span className="reviewer-name">Clara Montgomery</span>
                                        <span className="reviewer-title-sub">Beauty Editor, The Daily Silk</span>
                                    </div>
                                </div>
                            </div>
                            <div className="reviewer-card">
                                <p className="reviewer-comment">
                                    "I searched for smartphones and groceries alike, and the auto-suggestion speed combined with the rich visual cards is incredibly satisfying."
                                </p>
                                <div className="reviewer-meta">
                                    <div className="reviewer-avatar">MC</div>
                                    <div className="reviewer-name-container">
                                        <span className="reviewer-name">Marcus Chen</span>
                                        <span className="reviewer-title-sub">Tech Editor, The Silicon Gazette</span>
                                    </div>
                                </div>
                            </div>
                            <div className="reviewer-card">
                                <p className="reviewer-comment">
                                    "This interface is what plush professionalism looks like. Responsive, clean, and stunning on mobile."
                                </p>
                                <div className="reviewer-meta">
                                    <div className="reviewer-avatar">SA</div>
                                    <div className="reviewer-name-container">
                                        <span className="reviewer-name">Sophia Al-Jamil</span>
                                        <span className="reviewer-title-sub">UX Architect</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT DETAILS VIEW */}
            {view === 'product-detail' && selectedProduct && (
                <div className="product-detail-container">
                    <div className="back-btn-wrapper">
                        <button className="btn-back" onClick={() => setView('store')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <span>Back to Store</span>
                        </button>
                    </div>

                    <div className="product-detail-grid">
                        {/* Gallery Section */}
                        <div className="product-detail-gallery">
                            {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                <div className="gallery-main-wrapper">
                                    <img 
                                        src={selectedProduct.images[activeImageIndex] || selectedProduct.images[0]} 
                                        alt={selectedProduct.title} 
                                        className="gallery-main-img" 
                                    />
                                    {selectedProduct.images.length > 1 && (
                                        <div className="gallery-thumbnails">
                                            {selectedProduct.images.map((img, idx) => (
                                                <img 
                                                    key={idx} 
                                                    src={img} 
                                                    alt={`${selectedProduct.title} view ${idx + 1}`} 
                                                    className={`gallery-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="gallery-main-placeholder">No Image Available</div>
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="product-detail-info">
                            <span className="text-label-sm detail-category">{selectedProduct.category}</span>
                            <h1 className="text-headline-lg detail-title">{selectedProduct.title}</h1>
                            {selectedProduct.brand && (
                                <span className="text-body-md detail-brand">by {selectedProduct.brand}</span>
                            )}

                            {/* Rating & Reviews Count */}
                            <div className="detail-rating-row">
                                <div className="rating-stars">
                                    {"★".repeat(Math.round(selectedProduct.rating))}
                                    {"☆".repeat(5 - Math.round(selectedProduct.rating))}
                                    <span className="rating-score"> {selectedProduct.rating}</span>
                                </div>
                                <span className="rating-reviews-count">({selectedProduct.reviews ? selectedProduct.reviews.length : 0} reviews)</span>
                            </div>

                            <hr className="detail-divider" />

                            {/* Price and Add to Bag */}
                            <div className="detail-price-row">
                                <div className="detail-price-block">
                                    <span className="detail-price">${selectedProduct.price}</span>
                                    {selectedProduct.discountPercentage > 0 && (
                                        <div className="detail-discount-block">
                                            <span className="detail-discount-pct">{selectedProduct.discountPercentage}% OFF</span>
                                            <span className="detail-original-price">
                                                ${(selectedProduct.price / (1 - selectedProduct.discountPercentage / 100)).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    className="btn-primary detail-add-btn" 
                                    disabled={selectedProduct.stock === 0 || selectedProduct.availabilityStatus === 'Out of Stock'}
                                    onClick={() => addToBag(selectedProduct)}
                                    style={(selectedProduct.stock === 0 || selectedProduct.availabilityStatus === 'Out of Stock') ? { opacity: 0.5, cursor: 'not-allowed', background: '#444', color: '#888', boxShadow: 'none' } : {}}
                                >
                                    {selectedProduct.stock === 0 || selectedProduct.availabilityStatus === 'Out of Stock' ? 'Out of Stock' : 'Add to Bag'}
                                </button>
                            </div>

                            <hr className="detail-divider" />

                            {/* Description */}
                            <div className="detail-section">
                                <h3 className="text-label-md detail-section-title">Description</h3>
                                <p className="text-body-md detail-description">{selectedProduct.description}</p>
                            </div>

                            {/* Logistics (Shipping / Warranty / Returns) */}
                            <div className="detail-section logistics-grid">
                                {selectedProduct.shippingInformation && (
                                    <div className="logistics-item">
                                        <span className="text-label-sm label-dim">Shipping</span>
                                        <span className="text-body-md">{selectedProduct.shippingInformation}</span>
                                    </div>
                                )}
                                {selectedProduct.warrantyInformation && (
                                    <div className="logistics-item">
                                        <span className="text-label-sm label-dim">Warranty</span>
                                        <span className="text-body-md">{selectedProduct.warrantyInformation}</span>
                                    </div>
                                )}
                                {selectedProduct.returnPolicy && (
                                    <div className="logistics-item">
                                        <span className="text-label-sm label-dim">Returns</span>
                                        <span className="text-body-md">{selectedProduct.returnPolicy}</span>
                                    </div>
                                )}
                                {selectedProduct.minimumOrderQuantity && (
                                    <div className="logistics-item">
                                        <span className="text-label-sm label-dim">Min. Order</span>
                                        <span className="text-body-md">{selectedProduct.minimumOrderQuantity} units</span>
                                    </div>
                                )}
                            </div>

                            {/* Physical Specifications (Dimensions & Weight) */}
                            {(selectedProduct.dimensions || selectedProduct.weight) && (
                                <div className="detail-section specs-section">
                                    <h3 className="text-label-md detail-section-title">Specifications</h3>
                                    <div className="specs-grid">
                                        {selectedProduct.weight && (
                                            <div className="specs-item">
                                                <span className="text-body-md label-dim">Weight:</span>
                                                <span className="text-body-md">{selectedProduct.weight} kg</span>
                                            </div>
                                        )}
                                        {selectedProduct.dimensions && (
                                            <div className="specs-item">
                                                <span className="text-body-md label-dim">Dimensions:</span>
                                                <span className="text-body-md">
                                                    {selectedProduct.dimensions.width}w × {selectedProduct.dimensions.height}h × {selectedProduct.dimensions.depth}d cm
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                                <div className="detail-section tags-section">
                                    <div className="detail-tags">
                                        {selectedProduct.tags.map((tag, idx) => (
                                            <span key={idx} className="detail-tag">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Restock Simulator */}
                            {currentUser?.role === 'admin' && (
                                <div className="detail-section restock-simulator">
                                    <h3 className="text-label-md detail-section-title">Simulator: Restock Item</h3>
                                    <div className="restock-input-row">
                                        <input 
                                            type="number" 
                                            min="1" 
                                            placeholder="Qty" 
                                            id="restock-qty-input"
                                            className="restock-input"
                                            defaultValue="10"
                                        />
                                        <button 
                                            className="btn-primary btn-restock"
                                            onClick={async () => {
                                                const qtyInput = document.getElementById('restock-qty-input');
                                                const qty = Number(qtyInput.value);
                                                if (isNaN(qty) || qty <= 0) return alert("Please enter a valid quantity.");
                                                
                                                try {
                                                    const res = await fetch(`http://localhost:5000/api/products/${selectedProduct.id}/restock`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify({ quantity: qty })
                                                    });
                                                    const data = await res.json();
                                                    
                                                    if (res.ok && data.success) {
                                                        alert(`Restocked successfully! New Stock: ${data.newStock}`);
                                                        
                                                        // Update selectedProduct local state
                                                        setSelectedProduct(prev => ({
                                                            ...prev,
                                                            stock: data.newStock,
                                                            availabilityStatus: data.availabilityStatus
                                                        }));
                                                        
                                                        // Refresh the catalog list
                                                        const refreshed = await fetchProducts(inputValue || query || "");
                                                        setResults(refreshed.products || []);
                                                    } else {
                                                        alert(`Restock failed: ${data.error}`);
                                                    }
                                                } catch (err) {
                                                    console.error("Restock request failed:", err);
                                                    alert("Network error while trying to restock.");
                                                }
                                            }}
                                        >
                                            Restock
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="detail-reviews-container">
                        <h2 className="text-headline-md reviews-title">Customer Reviews</h2>
                        {selectedProduct.reviews && selectedProduct.reviews.filter(r => !r.hidden).length > 0 ? (
                            <div className="reviews-list">
                                {selectedProduct.reviews.filter(r => !r.hidden).map((rev, idx) => (
                                    <div key={idx} className="review-card">
                                        <div className="review-header">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className="reviewer-name">{rev.reviewerName}</span>
                                                {rev.verified && (
                                                    <span className="verified-badge-pill">
                                                        ✓ Verified Purchaser
                                                    </span>
                                                )}
                                            </div>
                                            <span className="review-date">{new Date(rev.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="review-rating">
                                            {"★".repeat(rev.rating)}
                                            {"☆".repeat(5 - rev.rating)}
                                        </div>
                                        <p className="reviewer-comment">"{rev.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ opacity: 0.6, fontStyle: 'italic', marginBottom: '24px' }}>
                                No customer reviews yet. Be the first to share your thoughts.
                            </p>
                        )}

                        {/* Submit Review Form */}
                        <form onSubmit={handleSubmitReview} className="write-review-form">
                            <h3 className="text-headline-xs form-subtitle">Share Your Experience</h3>
                            
                            <div className="review-rating-selector-wrapper">
                                <span className="rating-label">Rating:</span>
                                <div className="star-rating-buttons">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
                                            onClick={() => setReviewRating(star)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '12px' }}>
                                <textarea
                                    className="form-input review-textarea"
                                    placeholder="Leave your comments about this product here..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows="3"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-submit-review"
                                disabled={reviewSubmitting}
                                style={{ marginTop: '12px' }}
                            >
                                {reviewSubmitting ? 'Submitting...' : 'Publish Review'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADMIN DASHBOARD VIEW */}
            {view === 'admin-dashboard' && currentUser?.role === 'admin' && (
                <div className="admin-dashboard-container">
                    <div className="hero-section" style={{ marginBottom: '32px' }}>
                        <span className="text-label-md hero-subtitle">Luxe Liquid Registry</span>
                        <h1 className="text-display-lg hero-title">Administration Portal</h1>
                        <p className="text-body-lg hero-description">
                            Manage inventory, moderate reviews, view transaction analytics, and configure account access levels.
                        </p>
                    </div>

                    {/* Dashboard Tab Selector */}
                    <div className="admin-tab-selector">
                        <button className={`admin-tab-btn ${adminTab === 'catalog' ? 'active' : ''}`} onClick={() => setAdminTab('catalog')}>Catalog & Editor</button>
                        <button className={`admin-tab-btn ${adminTab === 'moderation' ? 'active' : ''}`} onClick={() => setAdminTab('moderation')}>Critique Moderation</button>
                        <button className={`admin-tab-btn ${adminTab === 'analytics' ? 'active' : ''}`} onClick={() => setAdminTab('analytics')}>Sales Analytics</button>
                        <button className={`admin-tab-btn ${adminTab === 'accounts' ? 'active' : ''}`} onClick={() => setAdminTab('accounts')}>User Accounts</button>
                    </div>

                    <div className="admin-tab-content">
                        {/* TAB 1: CATALOG & EDITOR */}
                        {adminTab === 'catalog' && (
                            <div className="admin-panel-card">
                                <div className="panel-header">
                                    <h2 className="text-headline-md">Inventory Management</h2>
                                    {!editingProduct && !isCreatingProduct && (
                                        <button className="btn-primary" onClick={handleOpenCreate}>+ Add New Product</button>
                                    )}
                                </div>

                                {/* Edit/Create Form */}
                                {(editingProduct || isCreatingProduct) && (
                                    <form onSubmit={handleSaveProduct} className="admin-form-glass">
                                        <h3 className="text-headline-sm">{isCreatingProduct ? 'Create New Product' : `Editing: ${editingProduct.title}`}</h3>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label className="form-label">Product Title</label>
                                                <input className="form-input" type="text" value={formProductTitle} onChange={(e) => setFormProductTitle(e.target.value)} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Brand</label>
                                                <input className="form-input" type="text" value={formProductBrand} onChange={(e) => setFormProductBrand(e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Category</label>
                                                <select className="form-input select-input" value={formProductCategory} onChange={(e) => setFormProductCategory(e.target.value)}>
                                                    <option value="beauty">Beauty</option>
                                                    <option value="fragrances">Fragrances</option>
                                                    <option value="skin-care">Skin Care</option>
                                                    <option value="laptops">Laptops</option>
                                                    <option value="smartphones">Smartphones</option>
                                                    <option value="groceries">Groceries</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Price ($)</label>
                                                <input className="form-input" type="number" step="0.01" min="0" value={formProductPrice} onChange={(e) => setFormProductPrice(e.target.value)} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Discount Percentage (%)</label>
                                                <input className="form-input" type="number" step="0.1" min="0" max="100" value={formProductDiscount} onChange={(e) => setFormProductDiscount(e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Stock Level</label>
                                                <input className="form-input" type="number" min="0" value={formProductStock} onChange={(e) => setFormProductStock(e.target.value)} required />
                                            </div>
                                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                <label className="form-label">Description</label>
                                                <textarea className="form-input textarea-input" value={formProductDesc} onChange={(e) => setFormProductDesc(e.target.value)} rows="3" />
                                            </div>
                                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                <label className="form-label">Tags (comma-separated)</label>
                                                <input className="form-input" type="text" value={formProductTags} onChange={(e) => setFormProductTags(e.target.value)} placeholder="e.g. exclusive, limited-edition, curated" />
                                            </div>
                                        </div>
                                        <div className="form-actions-row">
                                            <button type="submit" className="btn-primary">Save Product</button>
                                            <button type="button" className="btn-secondary" onClick={() => { setEditingProduct(null); setIsCreatingProduct(false); }}>Cancel</button>
                                        </div>
                                    </form>
                                )}

                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Product Name</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Discount</th>
                                                <th>Stock Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map(product => {
                                                const finalPrice = product.discountPercentage > 0 
                                                    ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
                                                    : product.price;
                                                const isLowStock = product.stock > 0 && product.stock < 5;
                                                return (
                                                    <tr key={product.id}>
                                                        <td>
                                                            <img src={product.thumbnail} alt="" className="table-thumb" />
                                                        </td>
                                                        <td>
                                                            <div className="table-product-title">{product.title}</div>
                                                            {product.brand && <div className="table-subtext">by {product.brand}</div>}
                                                            <div className="table-tags">
                                                                {product.tags && product.tags.map(t => (
                                                                    <span key={t} className="table-tag-badge">#{t}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td style={{ textTransform: 'capitalize' }}>{product.category}</td>
                                                        <td>
                                                            {product.discountPercentage > 0 ? (
                                                                <div>
                                                                    <span style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>${finalPrice}</span>
                                                                    <div className="table-subtext-strike">${product.price}</div>
                                                                </div>
                                                            ) : (
                                                                <span>${product.price}</span>
                                                            )}
                                                        </td>
                                                        <td>{product.discountPercentage}%</td>
                                                        <td>
                                                            {product.stock === 0 ? (
                                                                <span className="stock-badge out">Out of Stock</span>
                                                            ) : isLowStock ? (
                                                                <span className="stock-badge low">Low Stock ({product.stock})</span>
                                                            ) : (
                                                                <span className="stock-badge in">In Stock ({product.stock})</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="table-actions">
                                                                <button className="btn-table edit" onClick={() => handleOpenEdit(product)}>Edit</button>
                                                                <button className="btn-table delete" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CRITIQUE MODERATION */}
                        {adminTab === 'moderation' && (
                            <div className="moderation-panel-grid">
                                <div className="admin-panel-card">
                                    <div className="panel-header">
                                        <h2 className="text-headline-md">Press Quotes Publisher</h2>
                                    </div>
                                    <form onSubmit={handleAddPressQuote} className="admin-form-glass" style={{ marginBottom: '24px' }}>
                                        <div className="form-group">
                                            <label className="form-label">News Outlet / Author</label>
                                            <input className="form-input" type="text" value={pressSource} onChange={(e) => setPressSource(e.target.value)} placeholder="e.g. The Silk Gazette" required />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '12px' }}>
                                            <label className="form-label">Quote Content</label>
                                            <textarea className="form-input textarea-input" value={pressQuote} onChange={(e) => setPressQuote(e.target.value)} placeholder="Enter quote..." rows="2" required />
                                        </div>
                                        <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>Publish Critique</button>
                                    </form>

                                    <div className="press-quotes-list-admin">
                                        {pressQuotes.map(q => (
                                            <div key={q._id} className="admin-press-card">
                                                <p className="quote-body">"{q.quote}"</p>
                                                <div className="quote-footer">
                                                    <span className="quote-source">— {q.source}</span>
                                                    <button className="btn-text-delete" onClick={() => handleDeletePressQuote(q._id)}>Remove</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="admin-panel-card">
                                    <div className="panel-header">
                                        <h2 className="text-headline-md">Customer Review Moderation</h2>
                                    </div>
                                    <div className="reviews-moderation-list">
                                        {results.map(product => {
                                            if (!product.reviews || product.reviews.length === 0) return null;
                                            return (
                                                <div key={product.id} className="product-reviews-mod-group">
                                                    <h3 className="mod-product-title">{product.title}</h3>
                                                    {product.reviews.map((rev, revIdx) => (
                                                        <div key={revIdx} className={`mod-review-card ${rev.hidden ? 'hidden-review' : ''}`}>
                                                            <div className="mod-review-header">
                                                                <span className="reviewer-name">{rev.reviewerName} <span className="review-email-dim">({rev.reviewerEmail})</span></span>
                                                                <span className="review-date">{new Date(rev.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="review-stars">{"★".repeat(rev.rating)}</div>
                                                            <p className="reviewer-comment">"{rev.comment}"</p>
                                                            <div className="mod-review-actions">
                                                                <label className="checkbox-label">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={!!rev.verified} 
                                                                        onChange={() => handleToggleReviewVerified(product.id, revIdx, rev.verified)} 
                                                                    />
                                                                    <span>Verified Purchaser</span>
                                                                </label>
                                                                <button 
                                                                    className={`btn-table-action ${rev.hidden ? 'show' : 'hide'}`}
                                                                    onClick={() => handleToggleReviewHidden(product.id, revIdx, rev.hidden)}
                                                                >
                                                                    {rev.hidden ? 'Show Review' : 'Hide Review'}
                                                                </button>
                                                                <button 
                                                                    className="btn-table-action delete-review"
                                                                    onClick={() => handleDeleteReview(product.id, revIdx)}
                                                                >
                                                                    Delete Review
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: SALES & ANALYTICS */}
                        {adminTab === 'analytics' && analyticsData && (
                            <div className="analytics-layout">
                                <div className="metrics-grid">
                                    <div className="metric-card">
                                        <span className="metric-label">Total Revenue</span>
                                        <span className="metric-value font-display">${analyticsData.totalRevenue}</span>
                                    </div>
                                    <div className="metric-card">
                                        <span className="metric-label">Average Order Value</span>
                                        <span className="metric-value font-display">${analyticsData.avgOrderValue}</span>
                                    </div>
                                    <div className="metric-card">
                                        <span className="metric-label">Total Orders</span>
                                        <span className="metric-value font-display">{analyticsData.totalOrders}</span>
                                    </div>
                                </div>

                                <div className="analytics-details-grid">
                                    <div className="analytics-details-left-group">
                                        <div className="admin-panel-card" style={{ marginBottom: '24px' }}>
                                            <h3 className="text-headline-md" style={{ marginBottom: '16px' }}>Category Breakdown</h3>
                                            <div className="category-revenue-list">
                                                {Object.entries(analyticsData.categoryRevenue || {}).map(([cat, rev]) => (
                                                    <div key={cat} className="category-revenue-row">
                                                        <span className="cat-name" style={{ textTransform: 'capitalize' }}>{cat}</span>
                                                        <span className="cat-val">${Number(rev).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                {Object.keys(analyticsData.categoryRevenue || {}).length === 0 && (
                                                    <p className="text-dim text-center">No sales logged yet.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="admin-panel-card">
                                            <h3 className="text-headline-md" style={{ marginBottom: '16px' }}>Abandoned Carts Monitor</h3>
                                            <div className="abandoned-carts-list">
                                                {abandonedCarts.map(cart => (
                                                    <div key={cart._id} className="abandoned-cart-row">
                                                        <div className="abandoned-cart-user">
                                                            <span className="user-email">{cart.email}</span>
                                                            <span className="updated-time">Last update: {new Date(cart.updatedAt).toLocaleTimeString()}</span>
                                                        </div>
                                                        <div className="abandoned-items-summary">
                                                            {cart.items.map(item => (
                                                                <span key={item.id} className="abandoned-item-tag">{item.title} (x{item.quantity})</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {abandonedCarts.length === 0 && (
                                                    <p className="text-dim text-center">No abandoned shopping carts.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-panel-card">
                                        <h3 className="text-headline-md" style={{ marginBottom: '16px' }}>Checkout Logs</h3>
                                        <div className="table-responsive">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>User</th>
                                                        <th>Items Purchased</th>
                                                        <th>Total Value</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analyticsData.logs && analyticsData.logs.map((log, idx) => (
                                                        <tr key={idx}>
                                                            <td>{log.email}</td>
                                                            <td>
                                                                <div className="log-items">
                                                                    {log.items.map((it, iIdx) => (
                                                                        <div key={iIdx} className="log-item-row">{it.title} <span style={{ color: 'var(--primary-gold)' }}>x{it.quantity}</span></div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td>${log.totalPrice}</td>
                                                            <td>{new Date(log.date).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {(!analyticsData.logs || analyticsData.logs.length === 0) && (
                                                        <tr>
                                                            <td colSpan="4" className="text-center text-dim">No checkouts completed yet.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: USER ACCOUNTS */}
                        {adminTab === 'accounts' && (
                            <div className="admin-panel-card">
                                <h2 className="text-headline-md" style={{ marginBottom: '20px' }}>User Account Management</h2>
                                
                                {/* Add Administrator Form */}
                                <form onSubmit={handleCreateAdmin} className="admin-form-glass" style={{ marginBottom: '32px', padding: '20px' }}>
                                    <h3 className="text-headline-sm" style={{ marginBottom: '16px', color: 'var(--primary-gold)' }}>Add New Administrator</h3>
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <input 
                                                className="form-input" 
                                                type="text" 
                                                value={adminFirstName} 
                                                onChange={(e) => setAdminFirstName(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <input 
                                                className="form-input" 
                                                type="text" 
                                                value={adminLastName} 
                                                onChange={(e) => setAdminLastName(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email Address</label>
                                            <input 
                                                className="form-input" 
                                                type="email" 
                                                value={adminEmail} 
                                                onChange={(e) => setAdminEmail(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Password</label>
                                            <input 
                                                className="form-input" 
                                                type="password" 
                                                value={adminPassword} 
                                                onChange={(e) => setAdminPassword(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="btn-primary" 
                                        style={{ marginTop: '16px' }}
                                        disabled={adminCreationLoading}
                                    >
                                        {adminCreationLoading ? 'Creating...' : 'Create Admin Account'}
                                    </button>
                                </form>

                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>User Details</th>
                                                <th>Role</th>
                                                <th>Last Login Activity</th>
                                                <th>Total Items Bought</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accountsList.map(acc => {
                                                const isSelf = acc.email === currentUser.email;
                                                return (
                                                    <tr key={acc.id || acc.email}>
                                                        <td>
                                                            {acc.firstName || acc.lastName ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                    <span style={{ fontWeight: 'bold', color: 'var(--color-on-background)' }}>
                                                                        {acc.firstName} {acc.lastName}
                                                                    </span>
                                                                    <span style={{ fontSize: '11px', opacity: 0.6 }}>{acc.email}</span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontWeight: 'bold' }}>{acc.email}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`profile-role ${acc.role}`}>
                                                                {acc.role === 'admin' ? 'Admin Portal' : 'Member'}
                                                            </span>
                                                        </td>
                                                        <td>{acc.lastLogin ? new Date(acc.lastLogin).toLocaleString() : 'Never logged in'}</td>
                                                        <td>{acc.totalPurchased || 0} units</td>
                                                        <td>
                                                            <button 
                                                                className={`btn-table ${acc.role === 'admin' ? 'demote' : 'promote'}`}
                                                                onClick={() => handleToggleUserRole(acc.email, acc.role)}
                                                                disabled={isSelf}
                                                                style={isSelf ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                            >
                                                                {acc.role === 'admin' ? 'Demote User' : 'Promote Admin'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Shopping Bag Sliding Drawer Overlay */}
            <div 
                className={`bag-drawer-overlay ${isBagOpen ? 'active' : ''}`} 
                onClick={() => setIsBagOpen(false)}
            />

            {/* Shopping Bag Sliding Drawer */}
            <div className={`bag-drawer ${isBagOpen ? 'active' : ''}`}>
                <div className="bag-header">
                    <h3 className="text-headline-md" style={{ margin: 0 }}>Shopping Bag</h3>
                    <button className="btn-close-bag" onClick={() => setIsBagOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="bag-items-list">
                    {bagItems.length === 0 ? (
                        <div className="bag-empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-outline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <p className="bag-empty-text text-body-md">Your bag is currently empty</p>
                        </div>
                    ) : (
                        bagItems.map((item) => (
                            <div key={item.id} className="bag-item">
                                <img src={item.thumbnail} alt={item.title} className="bag-item-img" />
                                <div className="bag-item-info">
                                    <div className="bag-item-title-row">
                                        <span className="bag-item-title">{item.title}</span>
                                        <button className="btn-remove-item" onClick={() => removeFromBag(item.id)}>Remove</button>
                                    </div>
                                    <span className="bag-item-price">${item.price}</span>
                                    
                                    <div className="bag-item-controls">
                                        <div className="quantity-selector">
                                            <button className="quantity-adjust-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                            <span className="quantity-display">{item.quantity}</span>
                                            <button className="quantity-adjust-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                        </div>
                                        {item.quantity > 1 && (
                                            <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>
                                                {item.price} * {item.quantity}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {bagItems.length > 0 && (
                    <div className="bag-footer">
                        <div className="bag-summary-row">
                            <span className="bag-summary-label">Total</span>
                            <span className="bag-summary-value">${calculateTotal()}</span>
                        </div>
                        <button 
                            className="btn-primary btn-checkout" 
                            onClick={handleCheckout}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>

            {/* Spinner CSS animation injected inline to avoid configuration clashes */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}} />
        </section>
    );
};

export default AutoSuggestion;