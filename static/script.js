// ===== App State =====
const app = {
    exercises: [],
    currentExercise: null,
    currentQuestionIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    hasChecked: false,
    isCorrect: null,
    showAnswer: false,
    progress: {}
};

// ===== DOM Elements =====
const screens = {
    splash: document.getElementById('splash-screen'),
    home: document.getElementById('home-screen'),
    list: document.getElementById('list-screen'),
    detail: document.getElementById('detail-screen'),
    quiz: document.getElementById('quiz-screen')
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadExercises();
    loadProgress();
    updateHomeStats();

    // Splash screen timer
    setTimeout(() => {
        showScreen('home');
    }, 3000);
});

// ===== Data Loading =====
async function loadExercises() {
    const urls = ['/static/data.json', 'static/data.json', 'data.json'];
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                app.exercises = await response.json();
                return;
            }
        } catch (e) {
            console.log('Failed to load from:', url);
        }
    }
    console.error('Could not load exercises data');
    alert('خطأ في تحميل البيانات! جرب تحديث الصفحة.');
}

// ===== Screen Navigation =====
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
    window.scrollTo(0, 0);
}

function showScreenEl(element) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    element.classList.add('active');
    window.scrollTo(0, 0);
}

// ===== Home Screen =====
function updateHomeStats() {
    document.getElementById('exercise-count').textContent = app.exercises.length + ' تمرين';

    const completed = Object.keys(app.progress).length;
    let totalCorrect = 0;
    let totalWrong = 0;

    Object.values(app.progress).forEach(p => {
        totalCorrect += p.correct || 0;
        totalWrong += p.wrong || 0;
    });

    if (completed > 0) {
        document.getElementById('progress-section').style.display = 'block';
        document.getElementById('completed-count').textContent = completed;
        document.getElementById('total-correct').textContent = totalCorrect;
    }
}

app.showHome = () => {
    updateHomeStats();
    showScreen('home');
};

// ===== Exercise List =====
app.showExerciseList = () => {
    const listEl = document.getElementById('exercise-list');
    listEl.innerHTML = '';

    app.exercises.forEach((ex, index) => {
        const isCompleted = app.progress[ex.title];
        const item = document.createElement('div');
        item.className = `exercise-item ${isCompleted ? 'completed' : ''}`;
        item.innerHTML = `
            <div class="exercise-number">${index + 1}</div>
            <div class="exercise-info">
                <h3>${escapeHtml(ex.title)}</h3>
                <p>${escapeHtml(ex.chapter)}</p>
            </div>
            <div class="exercise-arrow">
                <i class="fas fa-chevron-left"></i>
            </div>
        `;
        item.onclick = () => app.showExerciseDetail(index);
        listEl.appendChild(item);
    });

    showScreen('list');
};

// ===== Exercise Detail =====
app.showExerciseDetail = (index) => {
    app.currentExercise = app.exercises[index];
    app.currentExerciseIndex = index;

    document.getElementById('detail-title').textContent = 'التمرين';
    document.getElementById('detail-chapter').textContent = app.currentExercise.chapter;
    document.getElementById('detail-rule').textContent = app.currentExercise.rule;
    document.getElementById('detail-count').textContent = app.currentExercise.items.length;

    showScreen('detail');
};

// ===== Quiz / Fill In Blank =====
app.startExercise = () => {
    app.currentQuestionIndex = 0;
    app.correctCount = 0;
    app.wrongCount = 0;
    app.hasChecked = false;
    app.isCorrect = null;
    app.showAnswer = false;

    document.getElementById('quiz-title').textContent = app.currentExercise.title;
    document.getElementById('quiz-rule').textContent = app.currentExercise.rule;
    document.getElementById('total-q').textContent = app.currentExercise.items.length;

    renderQuestion();
    showScreen('quiz');
};

function renderQuestion() {
    const q = app.currentExercise.items[app.currentQuestionIndex];
    const total = app.currentExercise.items.length;

    // Reset UI
    document.getElementById('current-q').textContent = app.currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = q.question;

    const input = document.getElementById('answer-input');
    input.value = '';
    input.disabled = false;
    input.focus();

    document.getElementById('check-btn').style.display = 'flex';
    document.getElementById('feedback-box').style.display = 'none';
    document.getElementById('show-answer-btn').style.display = 'none';
    document.getElementById('correct-answer-box').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';

    // Update progress bar
    const progress = (app.currentQuestionIndex + 1) / total;
    document.getElementById('progress-fill').style.width = (progress * 100) + '%';

    // Update score
    document.getElementById('score-correct').textContent = app.correctCount;
    document.getElementById('score-wrong').textContent = app.wrongCount;

    app.hasChecked = false;
    app.isCorrect = null;
    app.showAnswer = false;
}

app.checkAnswer = () => {
    const input = document.getElementById('answer-input');
    const userAnswer = input.value.trim();

    if (!userAnswer) {
        input.focus();
        return;
    }

    const q = app.currentExercise.items[app.currentQuestionIndex];
    app.isCorrect = checkAnswer(userAnswer, q.answer);

    if (!app.hasChecked) {
        if (app.isCorrect) {
            app.correctCount++;
        } else {
            app.wrongCount++;
        }
        app.hasChecked = true;
    }

    // Update UI
    input.disabled = true;
    document.getElementById('check-btn').style.display = 'none';
    document.getElementById('score-correct').textContent = app.correctCount;
    document.getElementById('score-wrong').textContent = app.wrongCount;

    // Show feedback
    const feedbackBox = document.getElementById('feedback-box');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackText = document.getElementById('feedback-text');

    feedbackBox.style.display = 'block';
    feedbackBox.className = 'feedback-box ' + (app.isCorrect ? 'correct' : 'wrong');

    if (app.isCorrect) {
        feedbackIcon.className = 'fas fa-check-circle';
        feedbackText.textContent = 'صحيح! أحسنت ✅';
    } else {
        feedbackIcon.className = 'fas fa-times-circle';
        feedbackText.textContent = 'غلط! جرب مرة أخرى ❌';
        document.getElementById('show-answer-btn').style.display = 'flex';
    }

    // Show next button
    const nextBtn = document.getElementById('next-btn');
    nextBtn.style.display = 'flex';

    const isLast = app.currentQuestionIndex >= app.currentExercise.items.length - 1;
    document.getElementById('next-btn-text').textContent = isLast ? 'شوف النتيجة 🎉' : 'السؤال التالي →';
};

app.showCorrectAnswer = () => {
    const q = app.currentExercise.items[app.currentQuestionIndex];
    document.getElementById('correct-answer-text').textContent = q.answer;
    document.getElementById('correct-answer-box').style.display = 'block';
    document.getElementById('show-answer-btn').style.display = 'none';
    app.showAnswer = true;
};

app.nextQuestion = () => {
    const total = app.currentExercise.items.length;

    if (app.currentQuestionIndex < total - 1) {
        app.currentQuestionIndex++;
        renderQuestion();
    } else {
        showResult();
    }
};

// ===== Answer Checking Logic =====
function checkAnswer(user, correct) {
    const clean = (s) => s
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/[.!,?]$/, '');
    return clean(user) === clean(correct);
}

// ===== Result Modal =====
function showResult() {
    const total = app.currentExercise.items.length;
    const percentage = total > 0 ? Math.round((app.correctCount / total) * 100) : 0;

    document.getElementById('result-correct').textContent = app.correctCount;
    document.getElementById('result-wrong').textContent = app.wrongCount;
    document.getElementById('result-total').textContent = total;
    document.getElementById('result-percent').textContent = percentage + '%';

    // Animate circle
    const circle = document.getElementById('result-circle');
    const circumference = 339.292;
    const offset = circumference - (percentage / 100) * circumference;

    // Color based on score
    if (percentage >= 80) {
        circle.style.stroke = '#66bb6a';
        document.getElementById('result-message').textContent = 'ممتاز! كتقري زيان 👏';
    } else if (percentage >= 60) {
        circle.style.stroke = '#ffa726';
        document.getElementById('result-message').textContent = 'مزيان، زيد تمرن! 💪';
    } else {
        circle.style.stroke = '#ef5350';
        document.getElementById('result-message').textContent = 'زيد تمرن باش تحسن 📚';
    }

    // Trigger animation after small delay
    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 100);

    document.getElementById('result-modal').style.display = 'flex';

    // Save progress
    app.progress[app.currentExercise.title] = {
        correct: app.correctCount,
        wrong: app.wrongCount,
        total: total,
        percentage: percentage,
        date: new Date().toISOString()
    };
    saveProgress();
}

app.closeResult = () => {
    document.getElementById('result-modal').style.display = 'none';
    document.getElementById('result-circle').style.strokeDashoffset = 339.292;
    showScreen('list');
    updateHomeStats();
};

// ===== Quit Modal =====
app.confirmQuit = () => {
    document.getElementById('quit-modal').style.display = 'flex';
};

app.hideQuitModal = () => {
    document.getElementById('quit-modal').style.display = 'none';
};

app.quitExercise = () => {
    document.getElementById('quit-modal').style.display = 'none';
    showScreen('list');
};

// ===== Local Storage =====
function loadProgress() {
    try {
        const saved = localStorage.getItem('german_grammar_progress');
        if (saved) {
            app.progress = JSON.parse(saved);
        }
    } catch (e) {
        app.progress = {};
    }
}

function saveProgress() {
    try {
        localStorage.setItem('german_grammar_progress', JSON.stringify(app.progress));
    } catch (e) {
        console.error('Failed to save progress');
    }
}

// ===== Utilities =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (screens.quiz.classList.contains('active')) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!app.hasChecked) {
                app.checkAnswer();
            } else {
                app.nextQuestion();
            }
        }
    }
});
