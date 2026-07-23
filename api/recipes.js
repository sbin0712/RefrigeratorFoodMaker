export default async function handler(req, res) {
  const { ingredients } = req.query;
  if (!ingredients) {
    return res.status(400).json({ error: "ingredients query is required" });
  }
  const apiKey = process.env.SPOONACULAR_KEY;
  
  // 💡 1. API 엔드포인트를 complexSearch로 변경하고, 필수 파라미터들 추가
  const url = `https://api.spoonacular.com/recipes/complexSearch?includeIngredients=${encodeURIComponent(ingredients)}&addRecipeNutrition=true&fillIngredients=true&number=12&ignorePantry=true&sort=max-used-ingredients&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // 💡 2. complexSearch는 데이터를 배열이 아닌 객체 안에 { results: [...] } 형태로 줍니다.
    if (!data.results || data.results.length === 0) {
      return res.status(200).json([]);
    }

    // 💡 3. 프론트엔드(script.js)에서 사용하기 편하도록 영양소 데이터를 꺼내서 가공해 줍니다.
    const formattedRecipes = data.results.map(recipe => {
      // 영양소 배열에서 이름(name)으로 필요한 값만 찾아냅니다.
      const nutrients = recipe.nutrition?.nutrients || [];
      const getNutrient = (name) => {
        const item = nutrients.find(n => n.name === name);
        // 값이 있으면 소수점을 반올림해서 깔끔하게 리턴
        return item ? Math.round(item.amount) : null; 
      };

      return {
        ...recipe, // 기존 레시피 데이터(id, title, image, usedIngredients 등)는 그대로 복사
        calories: getNutrient("Calories"),
        protein: getNutrient("Protein"),
        carbs: getNutrient("Carbohydrates"),
        fat: getNutrient("Fat")
      };
    });

    // 💡 4. 가공된 배열을 프론트엔드로 전송!
    res.status(200).json(formattedRecipes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
}
