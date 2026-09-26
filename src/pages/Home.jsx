import { Link } from "react-router-dom"
import "./Home.css"

function Home() {
  return (
    <div className="home">

      <nav className="navbar">
        <h2 className="logo">FoodLoop</h2>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
        </div>
      </nav>

      <section className="hero">

        <div className="hero-content">
          <p className="tagline">SMART FOOD WASTE MANAGEMENT</p>

          <h1>
            Turn Surplus Food
            <br />
            Into Real Impact
          </h1>

          <p className="hero-text">
            FoodLoop helps restaurants manage surplus food
            and connect it with the right destination before
            it becomes waste.
          </p>

          <Link to="/login" className="hero-button">
            Get Started
          </Link>
        </div>

      </section>

      <section className="how-it-works">

        <h2>How FoodLoop Works</h2>

        <div className="steps">

          <div className="step">
            <div className="step-icon">🍽️</div>
            <h3>Restaurant</h3>
            <p>
              Restaurants register their available surplus food.
            </p>
          </div>

          <div className="step">
            <div className="step-icon">🔄</div>
            <h3>Smart Matching</h3>
            <p>
              FoodLoop finds a suitable destination for the food.
            </p>
          </div>

          <div className="step">
            <div className="step-icon">🌱</div>
            <h3>Reduce Waste</h3>
            <p>
              Surplus food gets redirected instead of being wasted.
            </p>
          </div>

        </div>

      </section>

    </div>
  )
}

export default Home