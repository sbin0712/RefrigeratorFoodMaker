
const QUICK_INGREDIENTS = ["계란","양파","마늘","김치","두부","대파","감자","당근"];
let selectedIngredients = [];

const tagList = document.getElementById('tagList');
const quickTags = document.getElementById('quickTags');
const ingredientInput = document.getElementById('ingredientInput');
const addBtn = document.getElementById('addBtn');
const findBtn = document.getElementById('findBtn');
const findBtnText = document.getElementById('findBtnText');
const resetBtn = document.getElementById('resetBtn');
const recipeGrid = document.getElementById('recipeGrid');
const resultTitle = document.getElementById('resultTitle');
const resultSub = document.getElementById('resultSub');
const mainView = document.getElementById('mainView');
const detailView = document.getElementById('detailView');
const detailContent = document.getElementById('detailContent');
const backBtn = document.getElementById('backBtn');

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
      computeResults();
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
      computeResults();
    };
    quickTags.appendChild(btn);
  });
}

function addIngredient() {
  const val = ingredientInput.value.trim();
  if (!val) return;
  val.split(',').map(s => s.trim()).filter(Boolean).forEach(v => {
    if (!selectedIngredients.includes(v)) selectedIngredients.push(v);
  });
  ingredientInput.value = '';
  renderTags();
  renderQuickTags();
  computeResults();
}

addBtn.onclick = addIngredient;
ingredientInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addIngredient();
});

resetBtn.onclick = () => {
  selectedIngredients = [];
  renderTags();
  renderQuickTags();
  computeResults();
};

findBtn.onclick = computeResults;

function matchRecipe(recipe) {
  const haveRequired = recipe.required.filter(r => selectedIngredients.includes(r));
  const missingRequired = recipe.required.filter(r => !selectedIngredients.includes(r));
  const haveOptional = recipe.optional.filter(o => selectedIngredients.includes(o));
  const missingOptional = recipe.optional.filter(o => !selectedIngredients.includes(o));
  const total = recipe.required.length + recipe.optional.length;
  const have = haveRequired.length + haveOptional.length;
  const matchPercent = total > 0 ? Math.round((have / total) * 100) : 0;
  const canCook = missingRequired.length === 0;
  return { haveRequired, missingRequired, haveOptional, missingOptional, matchPercent, canCook };
}

function computeResults() {
  if (selectedIngredients.length === 0) {
    recipeGrid.innerHTML = '<div class="empty-state">냉장고에 있는 재료를 입력하거나 선택해보세요 🥬</div>';
    resultTitle.textContent = '추천 레시피 0개';
    resultSub.textContent = '재료를 입력하면 추천 레시피가 여기에 표시돼요';
    return;
  }
  const scored = RECIPES.map(r => ({ recipe: r, match: matchRecipe(r) }))
    .filter(x => x.match.haveRequired.length > 0 || x.match.haveOptional.length > 0)
    .sort((a, b) => {
      if (a.match.canCook !== b.match.canCook) return a.match.canCook ? -1 : 1;
      return b.match.matchPercent - a.match.matchPercent;
    });

  resultTitle.textContent = `추천 레시피 ${scored.length}개`;
  resultSub.textContent = '필수 재료 완비 순으로 정렬했어요';

  if (scored.length === 0) {
    recipeGrid.innerHTML = '<div class="empty-state">일치하는 레시피가 없어요. 다른 재료를 입력해보세요 🙁</div>';
    return;
  }

  recipeGrid.innerHTML = '';
  scored.forEach((item, idx) => {
    const { recipe, match } = item;
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <div class="card-img">
        ${idx === 0 && match.canCook ? '<span class="badge-best">★ 최고 매칭</span>' : '<span></span>'}
        <span class="badge-match">${match.matchPercent}%</span>
      </div>
      <div class="card-body">
        <div class="card-title">🔍 ${recipe.name}</div>
        <div class="card-desc">${recipe.desc}</div>
        <div class="card-label">필수 재료</div>
        <div class="chips">
          ${recipe.required.map(r => selectedIngredients.includes(r)
            ? `<span class="chip-have">✓ ${r}</span>`
            : `<span class="chip-missing">✕ ${r}</span>`).join('')}
        </div>
        ${recipe.optional.length ? `
          <div class="card-label">있으면 좋은 재료</div>
          <div class="chips">
            ${recipe.optional.map(o => `<span class="chip-optional">${o}</span>`).join('')}
          </div>` : ''}
        <div class="card-meta">
          <span>⏱ ${recipe.time}분 · 👥 ${recipe.servings}인분</span>
          <span class="diff-badge">${recipe.difficulty}</span>
        </div>
      </div>
    `;
    card.onclick = () => showDetail(recipe);
    recipeGrid.appendChild(card);
  });
}

function showDetail(recipe) {
  const match = matchRecipe(recipe);
  mainView.style.display = 'none';
  detailView.classList.remove('hidden');
  detailContent.innerHTML = `
    <div class="detail-hero"></div>
    <div class="detail-card">
      <div class="detail-tags">
        <span class="tag-category">${recipe.category}</span>
        <span class="tag-diff">${recipe.difficulty}</span>
      </div>
      <div class="detail-title">🔍 ${recipe.name}</div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-num">${recipe.time}분</div><div class="stat-label">조리시간</div></div>
        <div class="stat-box"><div class="stat-num">${recipe.servings}인분</div><div class="stat-label">인원</div></div>
        <div class="stat-box"><div class="stat-num">${recipe.kcal}kcal</div><div class="stat-label">칼로리</div></div>
      </div>
      <div class="section-title">● 필수 재료 <span class="section-sub">— 없으면 요리가 안 돼요</span></div>
      <div class="ing-row">
        ${recipe.required.map(r => selectedIngredients.includes(r)
          ? `<span class="ing-have">✓ ${r}</span>`
          : `<span class="ing-missing">✕ ${r}</span>`).join('')}
      </div>
      <div class="section-title">✦ 있으면 좋은 재료 <span class="section-sub">— 더 맛있게 만들어줘요</span></div>
      <div class="ing-row">
        ${recipe.optional.map(o => `<span class="ing-optional">${o}</span>`).join('')}
      </div>
      <div class="ing-note">회색 재료는 없어도 되지만 있으면 훨씬 맛있어요</div>
      <div class="section-title">조리 순서</div>
      <ol class="steps">
        ${recipe.steps.map((step, i) => {
          const tipEntry = Object.entries(recipe.tips).find(([ing]) => step.includes(ing));
          let tipHtml = '';
          if (tipEntry) {
            tipHtml = `<div class="tip-box">💡 '${tipEntry[0]}' 없다면? ${tipEntry[1]}</div>`;
          }
          return `<li class="step-item"><div class="step-num">${i + 1}</div><div class="step-text">${step}</div></li>${tipHtml}`;
        }).join('')}
      </ol>
      <div class="cook-tip">💡 <b>요리 팁</b><br>${recipe.cookTip}</div>
    </div>
  `;
}

backBtn.onclick = () => {
  detailView.classList.add('hidden');
  mainView.style.display = 'block';
};

renderTags();
renderQuickTags();
computeResults();
