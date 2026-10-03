import { Link } from "react-router-dom"
import { useState } from "react"
import "./SurplusFood.css"

function SurplusFood() {
    const [foodName, setFoodName] = useState("")
    const [quantity, setQuantity] = useState("")
    const [unit, setUnit] = useState("Portions")
    const [category, setCategory] = useState("Cooked Food")
    const [availableUntil, setAvailableUntil] = useState("")
    const [notes, setNotes] = useState("")

    function handleSubmit(event) {
      event.preventDefault()

      const food = {
        id: Date.now(),
        foodName,
        quantity,
        unit,
        category,
        availableUntil,
        notes,
        status: "Available"
      }

      const existingFoods =
        JSON.parse(localStorage.getItem("foodListings")) || []

      existingFoods.push(food)

      localStorage.setItem(
        "foodListings",
        JSON.stringify(existingFoods)
      )

      console.log("Saved Surplus Food:", food)

      alert("Surplus food registered successfully!")
    }


  return (
    <div className="surplus-page">

      <nav className="surplus-nav">
        <h2>FoodLoop</h2>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      <main className="surplus-content">

        <div className="surplus-header">
          <p>FOOD MANAGEMENT</p>
          <h1>Add Surplus Food</h1>
          <span>
            Register surplus food so FoodLoop can find a suitable destination.
          </span>
        </div>

        <form className="surplus-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Food Name</label>
            <input
              type="text"
              placeholder="Example: Vegetable Rice"
              value={foodName}
              onChange={(event) => setFoodName(event.target.value)}
            />
          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                placeholder="Example: 25"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
              >
                <option>Portions</option>
                <option>Pieces</option>
                <option>KG</option>
                <option>Litres</option>
              </select>
            </div>

          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Food Category</label>
              <select>
                <option>Cooked Food</option>
                <option>Bakery</option>
                <option>Fruits & Vegetables</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Available Until</label>
              <input
                type="datetime-local"
                value={availableUntil}
                onChange={(event) => setAvailableUntil(event.target.value)}
              />
            </div>

          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              placeholder="Add information about the food..."
              rows="4"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            ></textarea>
          </div>

          <button type="submit">
            Register Surplus Food
          </button>

        </form>

      </main>

    </div>
  )
}

export default SurplusFood