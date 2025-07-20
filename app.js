const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const screens = document.querySelectorAll('.screen');
const questionText = document.getElementById('question-text');
const optionsUl = document.getElementById('options');
const progressSpan = document.getElementById('progress');
const timerSpan = document.getElementById('timer');
const scoreSummary = document.getElementById('score-summary');

let questions = [];
let currentIndex = 0;
let score = 0;
let timerId = null;
const USE_TIMER = true;
const PER_QUESTION_TIME = 15;
let timeLeft = PER_QUESTION_TIME;

function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

startBtn.addEventListener('click', async () => {
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const difficulty = document.getElementById('difficulty').value;
  questions = await fetchQuestions({ amount, category, difficulty });
  currentIndex = 0;
  score = 0;
  showScreen('quiz-screen');
  renderQuestion();
});

nextBtn.addEventListener('click', () => {
  currentIndex++;
  if (currentIndex < questions.length) {
    renderQuestion();
  } else {
    endQuiz();
  }
});

restartBtn.addEventListener('click', () => {
  currentIndex = 0;
  score = 0;
  showScreen('quiz-screen');
  renderQuestion();
});

homeBtn.addEventListener('click', () => {
  showScreen('home-screen');
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem('quizHistory');
  displayHistory();
});

async function fetchQuestions({ amount = 10, category = '', difficulty = '' }) {
  let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
  if (category) url += `&category=${category}`;
  if (difficulty) url += `&difficulty=${difficulty}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results.map(q => normalizeQuestion(q));
}

function normalizeQuestion(apiQ) {
  const decode = (str) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };
  const options = [...apiQ.incorrect_answers, apiQ.correct_answer]
    .map(decode)
    .sort(() => Math.random() - 0.5);
  return {
    question: decode(apiQ.question),
    options,
    answer: decode(apiQ.correct_answer)
  };
}

function renderQuestion() {
  clearTimer();
  nextBtn.disabled = true;
  const q = questions[currentIndex];
  progressSpan.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
  questionText.textContent = q.question;
  optionsUl.innerHTML = '';
  optionsUl.classList.remove('locked');
  q.options.forEach(opt => {
    const li = document.createElement('li');
    li.textContent = opt;
    li.addEventListener('click', () => selectOption(li, q.answer));
    optionsUl.appendChild(li);
  });
  if (USE_TIMER) {
    timerSpan.classList.remove('hidden');
    startTimer();
  } else {
    timerSpan.classList.add('hidden');
  }
}

function selectOption(li, answer) {
  if (optionsUl.classList.contains('locked')) return;
  optionsUl.classList.add('locked');
  const selected = li.textContent;
  if (selected === answer) {
    li.classList.add('correct');
    score++;
  } else {
    li.classList.add('wrong');
    [...optionsUl.children].forEach(c => {
      if (c.textContent === answer) c.classList.add('correct');
    });
  }
  clearTimer();
  nextBtn.disabled = false;
}

function startTimer() {
  timeLeft = PER_QUESTION_TIME;
  timerSpan.textContent = timeLeft;
  timerId = setInterval(() => {
    timeLeft--;
    timerSpan.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearTimer();
      autoSubmitTimeout();
    }
  }, 1000);
}

function autoSubmitTimeout() {
  const q = questions[currentIndex];
  [...optionsUl.children].forEach(li => {
    if (li.textContent === q.answer) li.classList.add('correct');
  });
  optionsUl.classList.add('locked');
  nextBtn.disabled = false;
}

function clearTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function endQuiz() {
  showScreen('result-screen');
  const percent = Math.round((score / questions.length) * 100);
  scoreSummary.textContent = `You scored ${score} out of ${questions.length} (${percent}%).`;

  const record = {
    date: new Date().toLocaleString(),
    score: score,
    total: questions.length,
    percentage: percent
  };

  let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
  history.push(record);
  localStorage.setItem('quizHistory', JSON.stringify(history));

  displayHistory();
}

function displayHistory() {
  const historyList = document.getElementById('history-list');
  const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
  historyList.innerHTML = '';
  history.reverse().slice(0, 5).forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.date} - ${entry.score}/${entry.total} (${entry.percentage}%)`;
    historyList.appendChild(li);
  });
}
