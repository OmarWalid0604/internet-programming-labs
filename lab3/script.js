/* ─────────────────────────────────────────
   CALCULATOR JS
   Structure: DOM → Events → Logic
───────────────────────────────────────── */

/* ══════════════════════════════════════
   1. DOM — Select Nodes
══════════════════════════════════════ */
const valueEl      = document.getElementById('value');
const expressionEl = document.getElementById('expression');
const displayEl    = document.querySelector('.display');
const allButtons   = document.querySelectorAll('.btn');
const opButtons    = document.querySelectorAll('.btn-op');


/* ══════════════════════════════════════
   2. STATE — Calculator Memory
══════════════════════════════════════ */
const state = {
  current:     '0',    // number currently shown
  previous:    '',     // number before operator
  operator:    null,   // pending operator (+, −, ×, ÷)
  justEvaled:  false,  // did we just press =?
  resetNext:   false,  // next digit replaces display
};


/* ══════════════════════════════════════
   3. EVENTS — Listen for Input
══════════════════════════════════════ */

// Button clicks (event delegation on the grid)
document.querySelector('.btn-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  triggerRipple(btn);

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  switch (action) {
    case 'digit':      handleDigit(value);    break;
    case 'double-zero':handleDigit('00');     break;
    case 'dot':        handleDot();           break;
    case 'operator':   handleOperator(value); break;
    case 'equals':     handleEquals();        break;
    case 'clear':      handleClear();         break;
    case 'percent':    handlePercent();       break;
  }
});

// Keyboard support
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if ('0123456789'.includes(key))    handleDigit(key);
  else if (key === '.')              handleDot();
  else if (key === '+')              handleOperator('+');
  else if (key === '-')              handleOperator('−');
  else if (key === '*')              handleOperator('×');
  else if (key === '/')              { e.preventDefault(); handleOperator('÷'); }
  else if (key === 'Enter' || key === '=') handleEquals();
  else if (key === 'Escape')         handleClear();
  else if (key === '%')              handlePercent();
  else if (key === 'Backspace')      handleBackspace();
});


/* ══════════════════════════════════════
   4. LOGIC — Functions
══════════════════════════════════════ */

/** Append a digit (or "00") to the current display */
function handleDigit(digit) {
  if (state.resetNext || state.justEvaled) {
    state.current   = digit === '00' ? '0' : digit;
    state.resetNext = false;
    state.justEvaled = false;
  } else {
    if (digit === '00') {
      if (state.current === '0') return; // no leading zeros
      state.current += '00';
    } else {
      state.current = state.current === '0' ? digit : state.current + digit;
    }
  }
  // Prevent ridiculously long numbers
  if (state.current.replace('.','').replace('-','').length > 12) return;
  updateDisplay();
}

/** Add decimal point */
function handleDot() {
  if (state.resetNext || state.justEvaled) {
    state.current    = '0.';
    state.resetNext  = false;
    state.justEvaled = false;
  } else if (!state.current.includes('.')) {
    state.current += '.';
  }
  updateDisplay();
}

/** Handle an operator button (+, −, ×, ÷) */
function handleOperator(op) {
  // If we already have a pending calculation, resolve it first
  if (state.operator && !state.resetNext) {
    const result = calculate(parseFloat(state.previous), parseFloat(state.current), state.operator);
    if (result === null) return showError();
    state.current = formatResult(result);
  }

  state.previous   = state.current;
  state.operator   = op;
  state.resetNext  = true;
  state.justEvaled = false;

  expressionEl.textContent = `${state.previous} ${op}`;
  highlightOp(op);
  updateDisplay();
}

/** Evaluate the current expression */
function handleEquals() {
  if (!state.operator || state.resetNext) return;

  const a      = parseFloat(state.previous);
  const b      = parseFloat(state.current);
  const result = calculate(a, b, state.operator);

  if (result === null) return showError();

  expressionEl.textContent = `${state.previous} ${state.operator} ${state.current} =`;
  state.current    = formatResult(result);
  state.previous   = '';
  state.operator   = null;
  state.resetNext  = false;
  state.justEvaled = true;

  clearOpHighlight();
  updateDisplay();
  bumpDisplay();
}

/** Clear everything */
function handleClear() {
  state.current    = '0';
  state.previous   = '';
  state.operator   = null;
  state.resetNext  = false;
  state.justEvaled = false;
  expressionEl.textContent = '';
  displayEl.classList.remove('error');
  clearOpHighlight();
  updateDisplay();
}

/** Percentage — divide current by 100 */
function handlePercent() {
  const val = parseFloat(state.current);
  if (isNaN(val)) return;
  state.current    = formatResult(val / 100);
  state.justEvaled = true;
  updateDisplay();
}

/** Backspace — remove last character */
function handleBackspace() {
  if (state.justEvaled || state.resetNext) return;
  state.current = state.current.length > 1
    ? state.current.slice(0, -1)
    : '0';
  updateDisplay();
}

/**
 * Core arithmetic
 * @returns {number|null} result, or null on division by zero
 */
function calculate(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? null : a / b;
    default:  return b;
  }
}

/**
 * Format result: avoid floating-point noise, cap length
 */
function formatResult(num) {
  if (!isFinite(num)) return 'Error';
  // Round to 10 decimal places to kill floating-point noise
  let str = parseFloat(num.toFixed(10)).toString();
  // If still too long, use exponential notation
  if (str.replace('.','').replace('-','').length > 12) {
    str = num.toExponential(5);
  }
  return str;
}


/* ══════════════════════════════════════
   5. UI HELPERS — Update the View
══════════════════════════════════════ */

/** Push state.current into the display element */
function updateDisplay() {
  valueEl.textContent = state.current;
  // Shrink font if number is long
  const len = state.current.length;
  valueEl.style.fontSize =
    len > 12 ? '1.2rem' :
    len > 9  ? '1.6rem' :
    len > 6  ? '2rem'   : '';
}

/** Brief scale-up animation on equals */
function bumpDisplay() {
  valueEl.classList.remove('bump');
  requestAnimationFrame(() => {
    valueEl.classList.add('bump');
    setTimeout(() => valueEl.classList.remove('bump'), 150);
  });
}

/** Show division-by-zero error */
function showError() {
  state.current = 'Error';
  state.operator   = null;
  state.previous   = '';
  state.resetNext  = true;
  displayEl.classList.add('error');
  updateDisplay();
}

/** Highlight the active operator button */
function highlightOp(op) {
  clearOpHighlight();
  opButtons.forEach(btn => {
    if (btn.dataset.value === op) btn.classList.add('active-op');
  });
}

function clearOpHighlight() {
  opButtons.forEach(btn => btn.classList.remove('active-op'));
}

/** Ripple effect on click */
function triggerRipple(btn) {
  btn.classList.remove('ripple');
  requestAnimationFrame(() => btn.classList.add('ripple'));
  setTimeout(() => btn.classList.remove('ripple'), 400);
}
