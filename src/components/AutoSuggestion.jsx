import React, { useEffect, useRef, useState } from 'react';

async function fetchProducts(query) {
    const url = query.trim().length > 0 
        ? `https://dummyjson.com/products/search?q=${query}`
        : 'https://dummyjson.com/products?limit=9';
    const res = await fetch(url);
    const data = await res.json();
    return data;
}

const AutoSuggestion = () => {
    const [inputValue, setInputValue] = useState("");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDropdownActive, setIsDropdownActive] = useState(false);
    
    // Page View Navigation ('store' | 'collections' | 'editorial' | 'bespoke')
    const [view, setView] = useState("store");
    
    // Collections Tabs ('tech' | 'makeup' | 'groceries')
    const [activeCollectionTab, setActiveCollectionTab] = useState("tech");
    const [collectionProducts, setCollectionProducts] = useState([]);
    const [collectionLoading, setCollectionLoading] = useState(false);
    
    // Shopping Bag States
    const [bagItems, setBagItems] = useState([]);
    const [isBagOpen, setIsBagOpen] = useState(false);
    
    const timerIdRef = useRef();
    const dropdownRef = useRef();

    // Helper to categorize products under Tech, Makeup, or Groceries
    const getProductCollection = (product) => {
        const cat = (product.category || "").toLowerCase();
        if (['smartphones', 'laptops', 'tablets', 'mobile-accessories', 'electronics', 'laptops-and-computers'].includes(cat)) {
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
                    
                    const res = await fetch(`https://dummyjson.com/products/category/${categoryEndpoint}`);
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
                                        <div key={product.id} className="product-card">
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToBag(product);
                                                        }}
                                                    >
                                                        Add to Bag
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
                                        <div key={product.id} className="product-card">
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToBag(product);
                                                        }}
                                                    >
                                                        Add to Bag
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

                    {/* Fictional News Outlets Grid */}
                    <div className="editorial-grid">
                        <div className="editorial-card">
                            <span className="editorial-quote-mark">“</span>
                            <p className="editorial-quote">
                                A masterclass in modern digital retail. Luxe Liquid turns online shopping into an art gallery experience.
                            </p>
                            <div className="editorial-source">The Glass Chronicle</div>
                        </div>
                        <div className="editorial-card">
                            <span className="editorial-quote-mark">“</span>
                            <p className="editorial-quote">
                                The 'Liquid Glass' UI framework uses backdrop blur and depth layers in a way that feels organic and highly tactile.
                            </p>
                            <div className="editorial-source">The Liquid Digest</div>
                        </div>
                        <div className="editorial-card">
                            <span className="editorial-quote-mark">“</span>
                            <p className="editorial-quote">
                                Curated goods meets high-fashion web design. This is where refinement lives.
                            </p>
                            <div className="editorial-source">The Velvet Gazette</div>
                        </div>
                        <div className="editorial-card">
                            <span className="editorial-quote-mark">“</span>
                            <p className="editorial-quote">
                                Redefining the digital shopping experience for high-end consumers through quiet luxury.
                            </p>
                            <div className="editorial-source">The Refined Herald</div>
                        </div>
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
                            onClick={() => alert(`Proceeding to checkout for $${calculateTotal()}`)}
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