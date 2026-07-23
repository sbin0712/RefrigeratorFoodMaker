// 변경 전: const QUICK_INGREDIENTS = [...]
// 변경 후:
let QUICK_INGREDIENTS = ["egg","onion","garlic","potato","tomato","cheese","chicken","mushroom"];

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
  // INGREDIENT_ICONS가 정의되지 않았을 경우를 대비한 안전 장치
  if (typeof INGREDIENT_ICONS === 'undefined') {
    return "🍽️";
  }
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
  
  // 1. 기존 재료들을 칩 형태로 렌더링
  QUICK_INGREDIENTS.forEach(ing => {
    const chip = document.createElement('div');
    // 선택되었을 때 'selected' 클래스 추가
    chip.className = 'chip' + (selectedIngredients.includes(ing) ? ' selected' : '');
    chip.innerHTML = `${ing}<button class="chip-remove" data-ing="${ing}">×</button>`;
    
    // 칩 클릭 시: 검색할 재료에 추가/해제 (x버튼 클릭 제외)
    chip.onclick = (e) => {
      if (e.target.classList.contains('chip-remove')) return; 
      if (selectedIngredients.includes(ing)) {
        selectedIngredients = selectedIngredients.filter(i => i !== ing);
      } else {
        selectedIngredients.push(ing);
      }
      renderTags();
      renderQuickTags();
    };

    // x 버튼 클릭 시: 자주 쓰는 재료 목록에서 아예 삭제
    chip.querySelector('.chip-remove').onclick = (e) => {
      e.stopPropagation(); // 부모(chip)의 클릭 이벤트 실행 방지
      QUICK_INGREDIENTS = QUICK_INGREDIENTS.filter(i => i !== ing);
      // 만약 이미 선택된 상태였다면 검색 목록에서도 빼주기
      selectedIngredients = selectedIngredients.filter(i => i !== ing);
      renderTags();
      renderQuickTags();
    };

    quickTags.appendChild(chip);
  });

  // 2. [ + 추가 ] 버튼 만들기
  const addBtn = document.createElement('button');
  addBtn.className = 'plus-frequent-dotted';
  addBtn.textContent = '+ 추가';
  addBtn.onclick = () => {
    const newIng = prompt("자주 쓰는 재료를 입력하세요 (예: beef, carrot):");
    if (newIng && newIng.trim() !== "") {
      const trimmed = newIng.trim().toLowerCase();
      // 중복 방지 로직
      if (!QUICK_INGREDIENTS.includes(trimmed)) {
        QUICK_INGREDIENTS.push(trimmed);
        renderQuickTags();
      } else {
        alert("이미 등록된 재료입니다!");
      }
    }
  };
  
  quickTags.appendChild(addBtn);
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

    // --- 💡 추가된 정렬 로직 ---
    data.sort((a, b) => {
      // a의 매칭률 계산
      const aUsed = a.usedIngredientCount || 0;
      const aMissed = a.missedIngredientCount || 0;
      const aTotal = aUsed + aMissed;
      const aPercent = aTotal > 0 ? (aUsed / aTotal) : 0;

      // b의 매칭률 계산
      const bUsed = b.usedIngredientCount || 0;
      const bMissed = b.missedIngredientCount || 0;
      const bTotal = bUsed + bMissed;
      const bPercent = bTotal > 0 ? (bUsed / bTotal) : 0;

      // 매칭률(%)이 높은 순(내림차순)으로 정렬
      return bPercent - aPercent;
    });
    // ---------------------------

    resultTitle.textContent = `추천 레시피 ${data.length}개`;
    // 안내 텍스트도 정렬 기준에 맞게 수정
    resultSub.textContent = '매칭률이 높은 순으로 정렬했어요'; 
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

    // 💡 API에서 영양소 데이터를 받아온다고 가정한 변수 처리 (데이터가 없으면 '-' 표시)
    const calories = recipe.calories ? `${recipe.calories}kcal` : '정보 없음';
    const protein = recipe.protein ? `${recipe.protein}g` : '-';
    const carbs = recipe.carbs ? `${recipe.carbs}g` : '-';
    const fat = recipe.fat ? `${recipe.fat}g` : '-';

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
        
       <!-- 💡 새롭게 추가된 영양 정보 영역 -->
        <div class="nutrition-info">
          <span class="nutri-badge calories">🔥 ${calories}</span>
          <span class="nutri-badge protein">단백질 ${protein}</span>
          <span class="nutri-badge carbs">탄수화물 ${carbs}</span>
          <span class="nutri-badge fat">지방 ${fat}</span>
        </div>

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
