export default async function handler(req, res) {
  const { ingredients } = req.query;
  if (!ingredients) {
    return res.status(400).json({ error: "ingredients query is required" });
  }
  const apiKey = process.env.SPOONACULAR_KEY;
  const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=12&ranking=1&ignorePantry=true&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
}
