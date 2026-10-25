(() => {
"use strict";
const $ = id => document.getElementById(id);
const WORDS = Array.isArray(window.HAN_HOC_WORDS) ? window.HAN_HOC_WORDS : [];
const GRAMMAR = Array.isArray(window.HAN_HOC_GRAMMAR) ? window.HAN_HOC_GRAMMAR : [];
const STORAGE_KEY = "hanHocProgress_v1";
const DEFAULT_STATE = {saved:[], learned:[], attempts:0, correct:0, theme:"light"};
let state = loadState();
let filteredWords = WORDS.slice();
let currentWordIndex = 0;
let meaningVisible = false;
let currentQuestion = null;
let questionAnswered = false;
let toastTimer;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {...DEFAULT_STATE};
    const parsed = JSON.parse(raw);
    return {
      saved: Array.isArray(parsed.saved) ? parsed.saved.filter(id => WORDS.some(w => w.id === id)) : [],
      learned: Array.isArray(parsed.learned) ? [...new Set(parsed.learned.filter(id => WORDS.some(w => w.id === id)))] : [],
      attempts: Number.isFinite(parsed.attempts) && parsed.attempts >= 0 ? parsed.attempts : 0,
      correct: Number.isFinite(parsed.correct) && parsed.correct >= 0 ? parsed.correct : 0,
      theme: parsed.theme === "dark" ? "dark" : "light"
    };
  } catch (error) {
    console.warn("Không đọc được dữ liệu đã lưu:", error);
    return {...DEFAULT_STATE};
  }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (error) { showToast("Trình duyệt không cho phép lưu dữ liệu trên thiết bị này."); }
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function updateStats() {
  $("statLearned").textContent = state.learned.length;
  $("statCorrect").textContent = state.correct;
  $("statAccuracy").textContent = state.attempts ? Math.round(state.correct / state.attempts * 100) + "%" : "—";
  $("statSaved").textContent = state.saved.length;
  $("quizScore").textContent = state.attempts
    ? `Tổng cộng ${state.correct}/${state.attempts} câu đúng`
    : "Chưa trả lời câu nào.";
}
function getCurrentWord() { return filteredWords[currentWordIndex] || null; }
function renderWord() {
  const word = getCurrentWord();
  $("emptyWords").classList.toggle("hidden", !!word);
  $("wordCard").classList.toggle("hidden", !word);
  if (!word) return;
  $("wordLevel").textContent = word.level;
  $("wordHanzi").textContent = word.hanzi;
  $("wordPinyin").textContent = word.pinyin;
  $("wordMeaning").textContent = word.meaning;
  $("wordMeaning").classList.toggle("hidden", !meaningVisible);
  $("revealHint").textContent = meaningVisible ? `${word.pos} · ${word.meaning}` : "Thử nhớ nghĩa trước khi lật thẻ.";
  $("exampleHanzi").textContent = word.example;
  $("examplePinyin").textContent = word.examplePinyin;
  $("exampleTranslation").textContent = word.translation;
  const saved = state.saved.includes(word.id);
  $("saveWord").classList.toggle("saved", saved);
  $("saveWord").setAttribute("aria-pressed", String(saved));
  $("saveWord").textContent = saved ? "★ Đã lưu ôn tập" : "☆ Lưu ôn tập";
  $("revealWord").textContent = meaningVisible ? "Ẩn nghĩa" : "Hiện nghĩa";
  $("wordCounter").textContent = `${currentWordIndex + 1} / ${filteredWords.length}`;
  $("wordStatus").textContent = "";
}
function applyWordFilters() {
  const query = $("wordSearch").value.trim().toLocaleLowerCase();
  const level = $("levelFilter").value;
  const topic = $("topicFilter").value;
  filteredWords = WORDS.filter(word => {
    const matchesQuery = [word.hanzi, word.pinyin, word.meaning, word.example, word.translation, word.pos]
      .some(value => String(value).toLocaleLowerCase().includes(query));
    return matchesQuery && (level === "all" || word.level === level) && (topic === "all" || word.topic === topic);
  });
  currentWordIndex = 0;
  meaningVisible = false;
  renderWord();
}
function moveWord(direction) {
  if (!filteredWords.length) return;
  currentWordIndex = (currentWordIndex + direction + filteredWords.length) % filteredWords.length;
  meaningVisible = false;
  renderWord();
}
function markLearned(wordId) {
  if (!state.learned.includes(wordId)) state.learned.push(wordId);
  saveState();
  updateStats();
}
function toggleSaved() {
  const word = getCurrentWord();
  if (!word) return;
  if (state.saved.includes(word.id)) {
    state.saved = state.saved.filter(id => id !== word.id);
    showToast("Đã bỏ từ khỏi danh sách ôn tập.");
  } else {
    state.saved.push(word.id);
    showToast("Đã lưu từ vào danh sách ôn tập.");
  }
  saveState(); renderWord(); renderReview(); updateStats();
}
function speakCurrentWord() {
  const word = getCurrentWord();
  if (!word) return;
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    $("wordStatus").textContent = "Trình duyệt này chưa hỗ trợ phát âm tự động.";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  utterance.onerror = () => { $("wordStatus").textContent = "Không phát được âm thanh trên thiết bị này."; };
  $("wordStatus").textContent = "Đang dùng giọng đọc tổng hợp của thiết bị; âm thanh có thể khác người bản xứ.";
  window.speechSynthesis.speak(utterance);
}
function renderReview() {
  const list = $("reviewList");
  list.innerHTML = "";
  const savedWords = state.saved.map(id => WORDS.find(word => word.id === id)).filter(Boolean);
  $("reviewEmpty").classList.toggle("hidden", savedWords.length > 0);
  savedWords.forEach(word => {
    const item = document.createElement("article");
    item.className = "review-item";
    const details = document.createElement("div");
    details.innerHTML = `<div class="hanzi-small">${escapeHTML(word.hanzi)} <span class="muted">${escapeHTML(word.pinyin)}</span></div><div>${escapeHTML(word.meaning)}</div><div class="muted">${escapeHTML(word.example)}</div>`;
    const actions = document.createElement("div");
    actions.className = "review-actions";
    const study = document.createElement("button");
    study.type = "button"; study.className = "mini-button"; study.textContent = "Học từ này";
    study.addEventListener("click", () => {
      $("wordSearch").value = word.hanzi; $("levelFilter").value = "all"; $("topicFilter").value = "all";
      applyWordFilters(); document.querySelector("#vocabulary").scrollIntoView({behavior:"smooth"});
    });
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "mini-button"; remove.textContent = "Bỏ lưu";
    remove.addEventListener("click", () => {
      state.saved = state.saved.filter(id => id !== word.id); saveState(); renderReview(); renderWord(); updateStats();
    });
    actions.append(study, remove); item.append(details, actions); list.append(item);
  });
}
function renderGrammar() {
  const container = $("grammarList");
  container.innerHTML = "";
  GRAMMAR.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = "grammar-card";
    article.innerHTML = `<span class="tag">${escapeHTML(item.level)} · ${index + 1}</span><h3>${escapeHTML(item.title)}</h3><div class="formula">${escapeHTML(item.formula)}</div><p>${escapeHTML(item.note)}</p><p class="example-hanzi">${escapeHTML(item.ex)}</p><p class="pinyin">${escapeHTML(item.py)}</p><p>${escapeHTML(item.vi)}</p>`;
    container.append(article);
  });
}
function pickRandom(array, excluded) {
  const candidates = array.filter(item => !excluded || item.id !== excluded.id);
  return candidates[Math.floor(Math.random() * candidates.length)];
}
function makeQuestion() {
  const level = $("quizLevel").value;
  const type = $("quizType").value;
  const pool = WORDS.filter(word => level === "all" || word.level === level);
  if (pool.length < 4) {
    $("quizPrompt").textContent = "Cần ít nhất 4 từ trong bộ lọc để tạo câu hỏi.";
    $("quizOptions").innerHTML = "";
    $("quizFeedback").textContent = "Hãy chọn nhãn cấp độ khác.";
    $("nextQuiz").disabled = true;
    currentQuestion = null;
    return;
  }
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const distractors = [];
  while (distractors.length < 3) {
    const candidate = pickRandom(pool, answer);
    if (candidate && !distractors.some(item => item.id === candidate.id)) distractors.push(candidate);
  }
  const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
  let promptHTML = "";
  if (type === "meaning") promptHTML = `<div class="hanzi">${escapeHTML(answer.hanzi)}</div><p>Chọn nghĩa tiếng Việt đúng.</p>`;
  if (type === "pinyin") promptHTML = `<div class="hanzi">${escapeHTML(answer.hanzi)}</div><p>Chọn pinyin phù hợp.</p>`;
  if (type === "sentence") promptHTML = `<div class="example-hanzi">${escapeHTML(answer.example.replace(answer.hanzi, "（　）"))}</div><p>Chọn nghĩa của từ được hỏi để hiểu câu.</p><p class="muted">${escapeHTML(answer.examplePinyin)}</p>`;
  currentQuestion = {answer, options, type};
  questionAnswered = false;
  $("quizTag").textContent = type === "meaning" ? "Nghĩa tiếng Việt" : type === "pinyin" ? "Pinyin" : "Từ vựng trong câu";
  $("quizNumber").textContent = "Câu luyện mới";
  $("quizPrompt").innerHTML = promptHTML;
  $("quizFeedback").textContent = "";
  $("quizFeedback").className = "feedback";
  $("nextQuiz").disabled = true;
  const optionsContainer = $("quizOptions");
  optionsContainer.innerHTML = "";
  options.forEach((word, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "option-button";
    const label = type === "pinyin" ? word.pinyin : word.meaning;
    button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHTML(label)}</span>`;
    button.addEventListener("click", () => answerQuestion(button, word));
    optionsContainer.append(button);
  });
}
function answerQuestion(button, selected) {
  if (questionAnswered || !currentQuestion) return;
  questionAnswered = true;
  const isCorrect = selected.id === currentQuestion.answer.id;
  state.attempts += 1;
  if (isCorrect) state.correct += 1;
  markLearned(currentQuestion.answer.id);
  saveState(); updateStats();
  [...$("quizOptions").querySelectorAll("button")].forEach(option => {
    option.disabled = true;
    const optionText = option.textContent;
    const answerText = currentQuestion.type === "pinyin" ? currentQuestion.answer.pinyin : currentQuestion.answer.meaning;
    if (optionText.includes(answerText)) option.classList.add("correct");
  });
  if (!isCorrect) button.classList.add("incorrect");
  $("quizFeedback").className = `feedback ${isCorrect ? "good" : "bad"}`;
  $("quizFeedback").textContent = isCorrect
    ? `Chính xác! ${currentQuestion.answer.hanzi} — ${currentQuestion.answer.pinyin} — ${currentQuestion.answer.meaning}.`
    : `Chưa đúng. Đáp án: ${currentQuestion.answer.hanzi} (${currentQuestion.answer.pinyin}) — ${currentQuestion.answer.meaning}.`;
  $("nextQuiz").disabled = false;
  $("quizNumber").textContent = isCorrect ? "Bạn đã trả lời đúng" : "Hãy xem lại đáp án";
}
const SENTENCE_PATTERNS = {
  study:{prompt:"Hãy viết: Tôi học tiếng Trung.",sample:"我学习中文。",pinyin:"Wǒ xuéxí Zhōngwén.",translation:"Tôi học tiếng Trung.",note:"Mẫu câu: chủ ngữ + động từ + tân ngữ."},
  like:{prompt:"Hãy viết: Tôi thích uống trà.",sample:"我喜欢喝茶。",pinyin:"Wǒ xǐhuan hē chá.",translation:"Tôi thích uống trà.",note:"喜欢 đứng trước hành động hoặc đối tượng được yêu thích."},
  question:{prompt:"Hãy viết: Bạn là sinh viên phải không?",sample:"你是学生吗？",pinyin:"Nǐ shì xuésheng ma?",translation:"Bạn là sinh viên phải không?",note:"吗 đặt cuối câu hỏi có/không."},
  negative:{prompt:"Hãy viết: Tôi không uống cà phê.",sample:"我不喝咖啡。",pinyin:"Wǒ bù hē kāfēi.",translation:"Tôi không uống cà phê.",note:"不 đứng trước động từ để phủ định."},
  custom:{prompt:"Tự đặt một câu tiếng Trung mà bạn đã học.",sample:"",pinyin:"",translation:"",note:"Với câu tự đặt, hãy kiểm tra cấu trúc và ngữ cảnh bằng giáo trình hoặc hỏi giảng viên."}
};
function normalizeSentence(value) { return value.trim().replace(/[。！？.!?，,、\s]/g, ""); }
function updateSentencePrompt() { $("sentencePrompt").textContent = SENTENCE_PATTERNS[$("sentencePattern").value].prompt; $("sentenceResult").textContent = ""; }
function checkSentence() {
  const input = $("sentenceInput").value.trim();
  if (!input) { $("sentenceResult").textContent = "Bạn hãy nhập câu tiếng Trung trước nhé."; return; }
  const pattern = SENTENCE_PATTERNS[$("sentencePattern").value];
  if (!pattern.sample) {
    $("sentenceResult").textContent = pattern.note;
    return;
  }
  const matches = normalizeSentence(input) === normalizeSentence(pattern.sample);
  $("sentenceResult").innerHTML = `<strong>${matches ? "Câu trùng với mẫu tham khảo." : "Câu chưa trùng hoàn toàn với mẫu."}</strong><p>Câu mẫu: <span class="example-hanzi">${escapeHTML(pattern.sample)}</span></p><p class="pinyin">${escapeHTML(pattern.pinyin)}</p><p>${escapeHTML(pattern.translation)}</p><p class="muted">${escapeHTML(pattern.note)} ${matches ? "Đây chỉ là đối chiếu chuỗi, không phải đánh giá toàn diện về ngữ pháp." : "Câu khác mẫu vẫn có thể đúng; công cụ chưa thể kết luận câu của bạn sai."}</p>`;
  if (matches) { markLearned("sentence-" + $("sentencePattern").value); showToast("Đã đối chiếu với câu mẫu."); }
}
function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("dark", theme === "dark");
  $("themeToggle").setAttribute("aria-pressed", String(theme === "dark"));
  saveState();
}
function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => item.classList.toggle("active", item === link));
  }));
}
function init() {
  if (!WORDS.length) {
    $("wordCard").classList.add("hidden");
    $("emptyWords").classList.remove("hidden");
    $("emptyWords").textContent = "Chưa tải được dữ liệu từ vựng. Hãy kiểm tra tệp data.js.";
  }
  $("wordSearch").addEventListener("input", applyWordFilters);
  $("levelFilter").addEventListener("change", applyWordFilters);
  $("topicFilter").addEventListener("change", applyWordFilters);
  $("prevWord").addEventListener("click", () => moveWord(-1));
  $("nextWord").addEventListener("click", () => moveWord(1));
  $("revealWord").addEventListener("click", () => { if (getCurrentWord()) { meaningVisible = !meaningVisible; renderWord(); if (meaningVisible) markLearned(getCurrentWord().id); } });
  $("saveWord").addEventListener("click", toggleSaved);
  $("speakWord").addEventListener("click", speakCurrentWord);
  $("quizType").addEventListener("change", makeQuestion);
  $("quizLevel").addEventListener("change", makeQuestion);
  $("newQuiz").addEventListener("click", makeQuestion);
  $("nextQuiz").addEventListener("click", makeQuestion);
  $("sentencePattern").addEventListener("change", updateSentencePrompt);
  $("checkSentence").addEventListener("click", checkSentence);
  $("clearSentence").addEventListener("click", () => { $("sentenceInput").value = ""; $("sentenceResult").textContent = ""; });
  $("clearSaved").addEventListener("click", () => {
    if (!state.saved.length) { showToast("Danh sách ôn tập đang trống."); return; }
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ từ đã lưu?")) { state.saved = []; saveState(); renderReview(); renderWord(); updateStats(); showToast("Đã xóa danh sách ôn tập."); }
  });
  $("resetProgress").addEventListener("click", () => {
    if (window.confirm("Đặt lại số từ đã học và kết quả luyện tập? Danh sách từ lưu ôn tập sẽ được giữ nguyên.")) {
      state.learned = []; state.attempts = 0; state.correct = 0; saveState(); updateStats(); showToast("Đã đặt lại tiến độ học.");
    }
  });
  $("themeToggle").addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
  setTheme(state.theme);
  renderGrammar(); applyWordFilters(); renderReview(); updateStats(); makeQuestion(); setupNavigation();
}
document.addEventListener("DOMContentLoaded", init);
})();