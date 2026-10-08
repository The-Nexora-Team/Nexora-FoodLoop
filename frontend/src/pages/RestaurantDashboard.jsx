import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import "./Dashboard.css"

function RestaurantDashboard() {

  const [foods, setFoods] = useState([])

  useEffect(() => {
    const savedFoods =
      JSON.parse(localStorage.getItem("foodListings")) || []

    setFoods(savedFoods)
  }, [])

  const totalQuantity = foods.reduce(
    (total, food) => total + Number(food.quantity || 0),
    0
  )

  const activeListings = foods.filter(
    (food) => food.status === "Available"
  ).length

  return (
    <div className="dashboard">

      <nav className="dashboard-nav">
        <h2>FoodLoop</h2>

        <Link to="/">
          Home
        </Link>
      </nav>

      <main className="dashboard-content">

        <div className="dashboard-header">

          <div>
            <p className="dashboard-label">
              RESTAURANT DASHBOARD
            </p>

            <h1>Welcome back 👋</h1>

            <p>
              Manage your surplus food and help reduce waste.
            </p>
          </div>

          <Link
            to="/surplus-food"
            className="add-button"
          >
            + Add Surplus Food
          </Link>

        </div>


        <div className="stats">

          <div className="stat-card">
            <span>Surplus Food</span>

            <strong>
              {totalQuantity}
            </strong>

            <small>
              Total quantity registered
            </small>
          </div>


          <div className="stat-card">
            <span>Active Listings</span>

            <strong>
              {activeListings}
            </strong>

            <small>
              Currently available
            </small>
          </div>


          <div className="stat-card">
            <span>Food Listings</span>

            <strong>
              {foods.length}
            </strong>

            <small>
              Total listings
            </small>
          </div>

        </div>


        <section className="recent-section">

          <div className="section-header">

            <h2>
              Recent Surplus Food
            </h2>

            <Link to="/food-listings">
              View all
            </Link>

          </div>


          <div className="food-list">

            {foods.length === 0 ? (

              <div className="food-item">

                <div>
                  <h3>
                    No surplus food yet
                  </h3>

                  <p>
                    Add your first food listing to get started.
                  </p>
                </div>

              </div>

            ) : (

              foods.slice(-5).reverse().map((food) => (

                <div
                  className="food-item"
                  key={food.id}
                >

                  <div>

                    <h3>
                      {food.foodName}
                    </h3>

                    <p>
                      {food.quantity} {food.unit}
                    </p>

                  </div>

                  <span className="status">
                    {food.status}
                  </span>

                </div>

              ))

            )}

          </div>

        </section>

      </main>

    </div>
  )
}

export default RestaurantDashboard