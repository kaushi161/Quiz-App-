// ==== Screen Handling ====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// ==== Elements ====
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const clearHistoryBtn = document.getElementById('clear-history');
const logoutBtn = document.getElementById('logout-btn');  // <-- Logout button

const categoryEl = document.getElementById('category');
const difficultyEl = document.getElementById('difficulty');
const numberEl = document.getElementById('number');

const questionText = document.getElementById('question-text');
const optionsUl = document.getElementById('options');
const progress = document.getElementById('progress');
const scoreSummary = document.getElementById('score-summary');
const historyList = document.getElementById('history-list');

let currentQuestion = 0;
let score = 0;
let questions = [];

// ==== Dummy Login ====
const USERNAME = "admin";
const PASSWORD = "1234";

loginBtn.addEventListener("click", () => {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === USERNAME && pass === PASSWORD) {
    loginError.textContent = "";
    showScreen("home-screen");
  } else {
    loginError.textContent = "Invalid username or password.";
  }
});

// ==== Start Quiz ====
startBtn.addEventListener("click", async () => {
  const category = categoryEl.value;
  const difficulty = difficultyEl.value;
  const amount = numberEl.value;

  let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
  if (category) url += `&category=${category}`;
  if (difficulty) url += `&difficulty=${difficulty}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    questions = data.results;
    currentQuestion = 0;
    score = 0;
    showScreen("quiz-screen");
    renderQuestion();
  } catch (err) {
    alert("Failed to load questions.");
  }
});

// ==== Render Question ====
function renderQuestion() {
  const q = questions[currentQuestion];
  const answers = [...q.incorrect_answers];
  const correctIndex = Math.floor(Math.random() * 4);
  answers.splice(correctIndex, 0, q.correct_answer);

  progress.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
  questionText.innerHTML = decodeHTML(q.question);
  optionsUl.innerHTML = "";
  nextBtn.disabled = true;

  answers.forEach(answer => {
    const li = document.createElement("li");
    li.textContent = decodeHTML(answer);
    li.addEventListener("click", () => selectOption(li, decodeHTML(q.correct_answer)));
    optionsUl.appendChild(li);
  });
}

// ==== Select Option ====
function selectOption(selectedEl, correctAnswer) {
  const selected = selectedEl.textContent;
  const allOptions = optionsUl.querySelectorAll("li");

  allOptions.forEach(li => {
    li.removeEventListener("click", () => {});
    li.classList.add("disabled");
  });

  if (selected === correctAnswer) {
    selectedEl.classList.add("correct");
    score++;
  } else {
    selectedEl.classList.add("wrong");
    allOptions.forEach(li => {
      if (li.textContent === correctAnswer) li.classList.add("correct");
    });
  }

  nextBtn.disabled = false;
}

// ==== Next Button ====
nextBtn.addEventListener("click", () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
});

// ==== Show Results ====
function showResults() {
  showScreen("result-screen");
  scoreSummary.textContent = `You scored ${score} out of ${questions.length}.`;

  // Save to history
  const attempt = {
    date: new Date().toLocaleString(),
    score: `${score}/${questions.length}`
  };
  const history = JSON.parse(localStorage.getItem("quizHistory")) || [];
  history.unshift(attempt);
  localStorage.setItem("quizHistory", JSON.stringify(history));
  renderHistory();
}

// ==== Render History ====
function renderHistory() {
  const history = JSON.parse(localStorage.getItem("quizHistory")) || [];
  historyList.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.date} - ${item.score}`;
    historyList.appendChild(li);
  });
}

// ==== Restart / Home / Clear History ==== 
restartBtn.addEventListener("click", () => {
  currentQuestion = 0;
  score = 0;
  showScreen("quiz-screen");
  renderQuestion();
});

homeBtn.addEventListener("click", () => {
  showScreen("home-screen");
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("quizHistory");
  renderHistory();
});

// ==== Logout Button ====
logoutBtn.addEventListener("click", () => {
  showScreen("login-screen");
});

// ==== HTML Decode ====
function decodeHTML(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}
