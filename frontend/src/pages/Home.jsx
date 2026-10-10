import { Link } from 'react-router-dom';
import { useFoodLoop } from '../context/FoodLoopContext.jsx';
import { calculateTotalImpact } from '../utils/impact.js';
import ImpactCounter from '../components/ImpactCounter.jsx';
import './Home.css';

export default function Home() {
  const { state } = useFoodLoop();
  const impact = calculateTotalImpact(state.listings, state.handovers, state.volunteers);

  return (
    <div className="home">
      {/* Full-Page Luminous Animated Aurora & Floating Particle Canvas */}
      <div className="fullpage-bg-anim-container" aria-hidden="true">
        <div className="fullpage-grid-pattern" />
        <div className="fullpage-glow-orb orb-top-emerald" />
        <div className="fullpage-glow-orb orb-top-gold" />
        <div className="fullpage-glow-orb orb-mid-cyan" />
        <div className="fullpage-glow-orb orb-mid-teal" />
        <div className="fullpage-glow-orb orb-center-amber" />
        <div className="fullpage-glow-orb orb-bottom-emerald" />
        <div className="fullpage-glow-orb orb-bottom-gold" />
        <div className="fullpage-light-sweep" />
        <div className="fullpage-particle fp-1" />
        <div className="fullpage-particle fp-2" />
        <div className="fullpage-particle fp-3" />
        <div className="fullpage-particle fp-4" />
        <div className="fullpage-particle fp-5" />
        <div className="fullpage-particle fp-6" />
        <div className="fullpage-particle fp-7" />
        <div className="fullpage-particle fp-8" />
        <div className="fullpage-particle fp-9" />
        <div className="fullpage-particle fp-10" />
        <div className="fullpage-particle fp-11" />
        <div className="fullpage-particle fp-12" />
      </div>

      {/* Top Navbar */}
      <nav className="navbar">
        <Link to="/" className="logo-container" aria-label="FoodLoop Home">
          <img
            src="/images/logo-icon.png"
            alt="FoodLoop Logo"
            className="logo-icon"
          />
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/impact">Live Impact</Link>
          <Link to="/login" className="login-link-btn">Launch Demo</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <span>🇱🇰 SRI LANKA'S TIME-CRITICAL SURPLUS FOOD NETWORK</span>
            </div>

            <h1>
              FoodLoop makes restaurants money by wasting less,
              <span className="hero-highlight"> and whatever is left still feeds people.</span>
            </h1>

            <p className="hero-text">
              Surplus food degrades by the hour. FoodLoop guides every batch down an income ladder — selling at a discount for direct profit, donating to children's homes, or recycling before safety expires.
            </p>

            <div className="hero-cta-group">
              <Link to="/login" className="fl-btn fl-btn-primary fl-btn-lg">
                🚀 Explore Live Demo
              </Link>
              <Link to="/impact" className="fl-btn fl-btn-ghost fl-btn-lg">
                📊 View Impact Metrics
              </Link>
            </div>

            {/* Quick Role Entry Bar */}
            <div className="quick-roles-bar">
              <span className="quick-roles-label">Quick Role Demo:</span>
              <Link to="/login" className="role-chip">🍽️ Restaurant</Link>
              <Link to="/login" className="role-chip">🏠 Receiver Home</Link>
              <Link to="/login" className="role-chip">🚴 Volunteer Courier</Link>
            </div>

            {/* Live Counter Card */}
            <div className="hero-counter-card">
              <div className="counter-item">
                <span className="counter-icon">🍲</span>
                <div>
                  <div className="counter-val">
                    <ImpactCounter targetValue={impact.totalMeals + 120} />
                  </div>
                  <span className="counter-label">Meals Rescued in Colombo</span>
                </div>
              </div>
              <div className="counter-divider" />
              <div className="counter-item">
                <span className="counter-icon">💰</span>
                <div>
                  <div className="counter-val">
                    <ImpactCounter targetValue={impact.totalMoneyRecovered + 185000} prefix="LKR " />
                  </div>
                  <span className="counter-label">Financial Value Recovered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual Showcase */}
          <div className="hero-visual-container">
            <div className="hero-image-card">
              <img
                src="/images/hero-buffet.jpg"
                alt="Gourmet Sri Lankan Surplus Food Spread"
                className="hero-main-photo"
              />
              <div className="hero-overlay-tag top-left">
                <span className="live-pulse-dot"></span>
                <span>🔥 Live Colombo Rescues Active</span>
              </div>
              <div className="hero-overlay-tag bottom-right">
                <span>⏱️ Real-Time Expiry Countdown & GPS Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step Income Ladder Section */}
      <section className="income-ladder-section">
        <div className="section-head">
          <p className="section-subtitle">THE CORE PROPOSITION</p>
          <h2>The FoodLoop Surplus Income Ladder</h2>
          <p className="section-desc">
            Surplus food moves down four sequential steps to maximize financial yield and guarantee zero edible waste.
          </p>
        </div>

        <div className="ladder-cards-grid">
          <div className="ladder-step-card step-prevent">
            <div className="step-num">Step 1</div>
            <div className="step-icon-lg">📊</div>
            <h3>1. Prevent</h3>
            <p>
              AI kitchen prep recommendations forecast historical demand with safety margins so less surplus is prepared in the first place.
            </p>
            <span className="step-benefit">Saves 10-18% prep cost</span>
          </div>

          <div className="ladder-step-card step-sell">
            <div className="step-num">Step 2</div>
            <div className="step-icon-lg">🏷️</div>
            <h3>2. Dynamic Sell</h3>
            <p>
              Last-hour flash sales discount surplus (20% to 70%) to customers nearby, anchored above the restaurant's price floor.
            </p>
            <span className="step-benefit">Direct cash recovery</span>
          </div>

          <div className="ladder-step-card step-donate">
            <div className="step-num">Step 3</div>
            <div className="step-icon-lg">🤝</div>
            <h3>3. Smart Match</h3>
            <p>
              Automated multi-factor algorithm matches food to verified children's & elders' homes with volunteer courier dispatch.
            </p>
            <span className="step-benefit">Tax deduction receipt</span>
          </div>

          <div className="ladder-step-card step-recycle">
            <div className="step-num">Step 4</div>
            <div className="step-icon-lg">🌱</div>
            <h3>4. Bio-Cycle</h3>
            <p>
              Any food unsuited for safe human consumption is diverted to certified livestock feed and composting partners.
            </p>
            <span className="step-benefit">100% landfill diversion</span>
          </div>
        </div>
      </section>

      {/* How it Works / 3 Role Personas */}
      <section className="how-it-works">
        <div className="section-head" style={{ marginBottom: '2.5rem' }}>
          <p className="section-subtitle">A CONNECTED ECOSYSTEM</p>
          <h2>Built for All Stakeholders in Sri Lanka</h2>
          <p className="section-desc">Empowering food businesses, social institutions, and active citizens to eliminate waste together.</p>
        </div>

        <div className="steps">
          <div className="step-card-visual persona-restaurant">
            <div className="step-photo-wrap">
              <img src="/images/biryani.jpg" alt="Commercial Kitchen Surplus" className="step-photo" />
              <div className="step-photo-badge">🍽️ RESTAURANTS & HOTELS</div>
            </div>
            <div className="step-card-content">
              <h3>Restaurants, Hotels & Caterers</h3>
              <p>
                Turn potential kitchen waste into cash profit with discounted flash sales, or claim official CSR tax deduction receipts for donations.
              </p>
              <Link to="/login" className="step-card-link">Enter Restaurant Portal →</Link>
            </div>
          </div>

          <div className="step-card-visual persona-receiver">
            <div className="step-photo-wrap">
              <img src="/images/community-shelter.jpg" alt="Community Meal Sharing" className="step-photo" />
              <div className="step-photo-badge">🏠 CHARITIES & SHELTERS</div>
            </div>
            <div className="step-card-content">
              <h3>Children's & Elders' Homes</h3>
              <p>
                Receive automated offers for wholesome hot meals matched to capacity and dietary focus, with full portion flexibility.
              </p>
              <Link to="/login" className="step-card-link">Enter Receiver Portal →</Link>
            </div>
          </div>

          <div className="step-card-visual persona-courier">
            <div className="step-photo-wrap">
              <img src="/images/courier-scooter.jpg" alt="FoodLoop Courier in Colombo" className="step-photo" />
              <div className="step-photo-badge">🛵 RESCUE COURIERS</div>
            </div>
            <div className="step-card-content">
              <h3>Volunteer & Paid Couriers</h3>
              <p>
                Claim rescue missions across Colombo, earn fair median courier payouts (or deliver pro-bono), and track routes on live maps.
              </p>
              <Link to="/login" className="step-card-link">Enter Courier Portal →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2026 FoodLoop Sri Lanka — Nexora Team. Real-Time Surplus Food Recovery Network.</p>
      </footer>
    </div>
  );
}