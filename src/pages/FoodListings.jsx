import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import "./FoodListings.css"

function FoodListings() {

  const [foods, setFoods] = useState([])

  useEffect(() => {
    const savedFoods =
      JSON.parse(localStorage.getItem("foodListings")) || []

    setFoods(savedFoods)
  }, [])

  return (
    <div className="listings-page">

      <nav className="listings-nav">
        <h2>FoodLoop</h2>

        <Link to="/dashboard">
          Dashboard
        </Link>
      </nav>

      <main className="listings-content">

        <div className="listings-header">
          <div>
            <p>FOOD MANAGEMENT</p>
            <h1>Food Listings</h1>
            <span>
              View surplus food currently registered in FoodLoop.
            </span>
          </div>

          <Link to="/surplus-food" className="add-listing-button">
            + Add Food
          </Link>
        </div>

        <div className="listings">

          {foods.length === 0 ? (

            <div className="empty-list">
              <h2>No food listings yet</h2>
              <p>
                Register surplus food to see it here.
              </p>
            </div>

          ) : (

            foods.map((food) => (

              <div className="listing-card" key={food.id}>

                <div className="listing-info">

                  <div>
                    <h2>{food.foodName}</h2>

                    <p>
                      {food.quantity} {food.unit}
                    </p>

                    <span>
                      {food.category}
                    </span>
                  </div>

                  <div className="listing-status">
                    {food.status}
                  </div>

                </div>

                <div className="listing-notes">
                  {food.notes}
                </div>

              </div>

            ))

          )}

        </div>

      </main>

    </div>
  )
}

export default FoodListings