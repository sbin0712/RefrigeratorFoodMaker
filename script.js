const QUICK_INGREDIENTS = ["egg","onion","garlic","potato","tomato","cheese","chicken","mushroom"];

const AUTOCOMPLETE_POOL = [
  "egg","onion","garlic","potato","tomato","cheese","chicken","mushroom",
  "beef","pork","rice","spinach","zucchini","cabbage","milk","butter",
  "cucumber","noodle","carrot","bell pepper","lemon","basil","olive oil","flour"
];


let selectedIngredients = [];
let hasSearched = false;

const tagList = document.getElementById('tagList');
const quickTags = document.getElementById('quickTags');
const ingredientInput = document.getElementById('ingredientInput');
const autocompleteList = document.getElementById('autocompleteList');
const addBtn = document.getElementById('addBtn');
const findBtn = document.getElementById('findBtn');
const findBtnText = document.getElementById('findBtnText');
const resetBtn = document.getElementById('resetBtn');
const recipeGrid = document.getElementById('recipeGrid');
const resultTitle = document.getElementById('resultTitle');
const resultSub = document.getElementById('resultSub');

function icon(ing) {
  return INGREDIENT_ICONS[ing.toLowerCase()] || "🍽️";
}

function renderTags() {
  tagList.innerHTML = '';
  selectedIngredients.forEach(ing => {
    const el = document.createElement('div');
    el.className = 'tag';
    el.innerHTML = `<span>${ing}</span><button data-ing="${ing}">✕</button>`;
    tagList.appendChild(el);
  });
  tagList.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      selectedIngredients = selectedIngredients.filter(i => i !== btn.dataset.ing);
      renderTags();
      renderQuickTags();
    };
  });
  findBtnText.textContent = selectedIngredients.length > 0
    ? `${selectedIngredients.length}가지 재료로 요리 찾기`
    : '재료로 요리 찾기';
}

function renderQuickTags() {
  quickTags.innerHTML = '';
  QUICK_INGREDIENTS.forEach(ing => {
    const btn = document.createElement('button');
    btn.className = 'quick-tag' + (selectedIngredients.includes(ing) ? ' selected' : '');
    btn.textContent = ing;
    btn.onclick = () => {
      if (selectedIngredients.includes(ing)) {
        selectedIngredients = selectedIngredients.filter(i => i !== ing);
      } else {
        selectedIngredients.push(ing);
      }
      renderTags();
      renderQuickTags();
    };
    quickTags.appendChild(btn);
  });
}


function addIngredient(value) {
  const val = (value !== undefined ? value : ingredientInput.value).trim();
  if (!val) return;
  val.split(',').map(s => s.trim()).filter(Boolean).forEach(v => {
    if (!selectedIngredients.includes(v)) selectedIngredients.push(v);
  });
  ingredientInput.value = '';
  hideAutocomplete();
  renderTags();
  renderQuickTags();
}

function showAutocomplete() {
  const val = ingredientInput.value.trim().toLowerCase();
  if (!val) { hideAutocomplete(); return; }
  const matches = AUTOCOMPLETE_POOL.filter(i =>
    i.toLowerCase().includes(val) && !selectedIngredients.includes(i)
  ).slice(0, 6);
  if (matches.length === 0) { hideAutocomplete(); return; }
  autocompleteList.innerHTML = matches.map(m =>
    `<div class="autocomplete-item" data-val="${m}">${icon(m)} ${m}</div>`
  ).join('');
  autocompleteList.classList.remove('hidden');
  autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
    item.onclick = () => addIngredient(item.dataset.val);
  });
}

function hideAutocomplete() {
  autocompleteList.classList.add('hidden');
  autocompleteList.innerHTML = '';
}

ingredientInput.addEventListener('input', showAutocomplete);
ingredientInput.addEventListener('focus', showAutocomplete);
document.addEventListener('click', e => {
  if (!e.target.closest('.autocomplete-wrap')) hideAutocomplete();
});

addBtn.onclick = () => addIngredient();
ingredientInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addIngredient();
});

resetBtn.onclick = () => {
  selectedIngredients = [];
  hasSearched = false;
  renderTags();
  renderQuickTags();
  showIdleState();
};

findBtn.onclick = () => {
  if (selectedIngredients.length === 0) return;
  hasSearched = true;
  fetchRecipes();
};

function showIdleState() {
  recipeGrid.innerHTML = `
    <div class="empty-state">
      <span class="empty-emoji">🍽️</span>
      재료를 담고 "요리 찾기" 버튼을 눌러보세요
    </div>`;
  resultTitle.textContent = '추천 레시피';
  resultSub.textContent = '재료를 입력하고 찾기 버튼을 누르면 추천 레시피가 여기에 표시돼요';
}

function showLoadingState() {
  recipeGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-text">레시피를 찾는 중이에요...</div>
    </div>`;
  resultTitle.textContent = '검색 중...';
  resultSub.textContent = '';
}

function showEmptyResultState() {
  recipeGrid.innerHTML = `
    <div class="empty-state">
      <span class="empty-emoji">🙁</span>
      일치하는 레시피가 없어요. 다른 재료를 입력해보세요
      <div><button class="empty-retry" id="retryBtn">재료 다시 입력하기</button></div>
    </div>`;
  resultTitle.textContent = '추천 레시피 0개';
  resultSub.textContent = '';
  document.getElementById('retryBtn').onclick = () => {
    resetBtn.click();
    ingredientInput.focus();
  };
}

function showErrorState() {
  recipeGrid.innerHTML = `
    <div class="empty-state">
      <span class="empty-emoji">😢</span>
      레시피를 불러오지 못했어요. 잠시 후 다시 시도해주세요
    </div>`;
  resultTitle.textContent = '오류 발생';
  resultSub.textContent = '';
}

async function fetchRecipes() {
  showLoadingState();
  try {
    const query = selectedIngredients.join(',');
    const res = await fetch(`/api/recipes?ingredients=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      showEmptyResultState();
      return;
    }

    resultTitle.textContent = `추천 레시피 ${data.length}개`;
    resultSub.textContent = '가지고 있는 재료 순으로 정렬했어요';
    renderRecipeCards(data);
  } catch (err) {
    showErrorState();
  }
}

function matchClass(percent) {
  if (percent >= 80) return 'match-high';
  if (percent >= 50) return 'match-mid';
  return 'match-low';
}

function renderRecipeCards(recipes) {
  recipeGrid.innerHTML = '';
  recipes.forEach((recipe, idx) => {
    const usedCount = recipe.usedIngredientCount || 0;
    const missedCount = recipe.missedIngredientCount || 0;
    const total = usedCount + missedCount;
    const matchPercent = total > 0 ? Math.round((usedCount / total) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.style.animationDelay = `${idx * 0.06}s`;
    card.innerHTML = `
      <div class="card-img" style="background-image:url('${recipe.image}')">
        ${idx === 0 ? '<span class="badge-best">★ 최고 매칭</span>' : '<span></span>'}
        <span class="badge-match ${matchClass(matchPercent)}">${matchPercent}%</span>
      </div>
      <div class="card-body">
        <div class="card-title">${recipe.title}</div>
        <div class="card-label">가지고 있는 재료 (${usedCount})</div>
        <div class="chips">
          ${(recipe.usedIngredients || []).map(i => `<span class="chip-have">✓ ${i.name}</span>`).join('')}
        </div>
        ${missedCount > 0 ? `
          <div class="card-label">부족한 재료 (${missedCount})</div>
          <div class="chips">
            ${(recipe.missedIngredients || []).map(i => `<span class="chip-missing">✕ ${i.name}</span>`).join('')}
          </div>` : ''}
      </div>
    `;
    card.onclick = () => window.open(`https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, '-')}-${recipe.id}`, '_blank');
    recipeGrid.appendChild(card);
  });
}

renderTags();
renderQuickTags();
showIdleState();
