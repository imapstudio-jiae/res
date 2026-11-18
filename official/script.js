/**
 * IMAP Studio - Standalone Multi-View Router, Live Booking Engine & Staff Admin Hub
 * (Supabase Realtime DB + LocalStorage Fallback Sync Compatible with v1)
 */

// ──────────────────────────────────────────────────────────────────────────
// 1. Supabase Configuration & Storage Keys (Preserved from v1 app.js)
// ──────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = (typeof window !== 'undefined' && (window.NEXT_PUBLIC_SUPABASE_URL || window.SUPABASE_URL))
  || 'https://kntrffydktjflvgttnlt.supabase.co';
const SUPABASE_ANON = (typeof window !== 'undefined' && (window.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY))
  || 'sb_publishable_WBNiCS21h_NTVBLOnKNJiw_o0R8BPc3';

let db = null;
if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  } catch (err) {
    console.warn('Supabase client init fallback to local cache:', err);
  }
}

const STUDIO_ADDRESS = '경기도 광명시 도덕로 56, 중앙하이츠상가동 3층 304호';

const STORAGE_KEYS = {
  BOOKINGS: 'imap_studio_bookings_v1',
  BLOCKED_SCHEDULES: 'imap_studio_blocked_v1',
  WEEKLY_BLOCKED: 'imap_studio_weekly_blocks_v1',
  ADMIN_PW: 'imap_studio_admin_pw_v1',
  TIMETABLE_META: 'imap_studio_timetable_cards_v1',
  TIMETABLE_EXTRA: 'imap_studio_timetable_extra_v1',
  TODOS: 'imap_studio_todos_v1',
  MEMOS: 'imap_studio_memos_v1',
  EMAIL_CONFIG: 'imap_studio_email_config_v1',
  EMAIL_LOGS: 'imap_studio_email_logs_v1'
};

const ADMIN_SESSION_KEY = 'imap_admin_auth';
const DEFAULT_ADMIN_PASSWORDS = ['202424', '0000', 'imap2026'];

const DEFAULT_WEEKLY_BLOCKED = [
  { id: 'wblk-1', dayOfWeek: 2, time: '14:00', reason: '김재옹 (🎸 통기타 · 1대1)' },
  { id: 'wblk-2', dayOfWeek: 2, time: '15:00', reason: '김준오 (🎸 통기타 · 그룹 4)' },
  { id: 'wblk-3', dayOfWeek: 4, time: '17:00', reason: '정기 기타 레슨 (🎸 통기타 · 1대1)' }
];

const DEFAULT_TIMETABLE_META = {
  'wblk-1': { student: '김재옹', subject: '🎸 통기타', format: '1대1' },
  'wblk-2': { student: '김준오', subject: '🎸 통기타', format: '그룹 4' },
  'wblk-3': { student: '정기 기타 레슨', subject: '🎸 통기타', format: '1대1' }
};

const DEFAULT_TODOS = [
  { id: 'todo-1', text: '레슨비 입금 상황 확인', tag: '행정/입금', done: true },
  { id: 'todo-2', text: '성인 앙상블 신곡 합주 준비', tag: '합주/레슨', done: true },
  { id: 'todo-3', text: '신규 대면 상담 예약자 일정 안내 연락', tag: '상담/일반', done: false },
  { id: 'todo-4', text: '컨트롤 룸 및 레코딩 부스 마이크 라인 점검', tag: '장비/시설', done: false }
];

const DEFAULT_MEMOS = [
  {
    id: 'memo-1',
    category: '🎙️ 장비/부스',
    title: '마이크 프리앰프 및 레코딩 부스 점검 완료',
    content: '메인 부스 1번 채널 케이블 및 Logic Pro 오디오 인터페이스 레이턴시 세팅 점검 완료되었습니다.',
    date: '2026.11.15'
  },
  {
    id: 'memo-2',
    category: '🎸 레슨/합주',
    title: '주간 고정 레슨 & 앙상블 시간표 연동 안내',
    content: '주간 시간표에서 카드를 드래그하여 요일·시간을 이동하면 방문자 예약 캘린더의 고정 레슨 차단 시간도 함께 반영됩니다.',
    date: '2026.11.15'
  },
  {
    id: 'memo-3',
    category: '☕ 비품/기타',
    title: '방문 상담 웰컴 티 및 커리큘럼 안내지 보충',
    content: '대면 상담 방문자용 웰컴 드링크 원두/티백 및 4단계 성장 사이클 브로셔 보충 완료.',
    date: '2026.11.15'
  }
];

const DEFAULT_EMAIL_CONFIG = {
  enabled: true,
  recipientEmail: 'jeje1120@nate.com',
  provider: 'gas',
  gasWebhookUrl: '',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: ''
};

const TIME_SLOTS_30 = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30'
];

const TIME_SLOTS_60 = [
  '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00'
];

const TIMETABLE_HOURS_60 = [...TIME_SLOTS_60, '20:00'];
const TIMETABLE_HOURS_30 = [...TIME_SLOTS_30, '20:00'];

const TIMETABLE_DAYS = [
  { day: 1, short: '월', name: '월요일' },
  { day: 2, short: '화', name: '화요일' },
  { day: 3, short: '수', name: '수요일' },
  { day: 4, short: '목', name: '목요일' },
  { day: 5, short: '금', name: '금요일' },
  { day: 6, short: '토', name: '토요일', isSat: true },
  { day: 0, short: '일', name: '일요일', isSun: true }
];

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// Memory Cache
const _cache = {
  bookings: [],
  blockedSchedules: [],
  weeklyBlocks: [],
  timetableMeta: {},
  timetableExtras: [],
  todos: [],
  memos: [],
  emailConfig: { ...DEFAULT_EMAIL_CONFIG },
  emailLogs: []
};

// App State
const bookingState = {
  currentCalendarMonth: new Date(),
  selectedMainType: '레슨 상담',
  selectedSubType: '통기타 (어쿠스틱)',
  selectedDate: null,
  selectedTime: null,
  timeInterval: 30,
  contactMethod: '카카오톡',
  lastSubmitted: null,
  kakaoChannelId: '_xmxmxbG',
  isSubmitting: false
};

const adminState = {
  activeTab: 'reservations',
  bookingFilter: 'all',
  bookingSearch: '',
  ttInterval: 60,
  draggedCardId: null,
  draggedCardSource: null
};

// ──────────────────────────────────────────────────────────────────────────
// 2. Utilities & LocalStorage / Supabase Sync Helpers
// ──────────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

function loadOpsLocalData() {
  const savedMeta = readLocal(STORAGE_KEYS.TIMETABLE_META, null);
  _cache.timetableMeta = savedMeta && typeof savedMeta === 'object'
    ? { ...DEFAULT_TIMETABLE_META, ...savedMeta }
    : { ...DEFAULT_TIMETABLE_META };

  const savedExtras = readLocal(STORAGE_KEYS.TIMETABLE_EXTRA, null);
  _cache.timetableExtras = Array.isArray(savedExtras) ? savedExtras : [];

  const savedTodos = readLocal(STORAGE_KEYS.TODOS, null);
  if (Array.isArray(savedTodos)) {
    _cache.todos = savedTodos;
  } else {
    _cache.todos = DEFAULT_TODOS.map(t => ({ ...t }));
    writeLocal(STORAGE_KEYS.TODOS, _cache.todos);
  }

  const savedMemos = readLocal(STORAGE_KEYS.MEMOS, null);
  if (Array.isArray(savedMemos)) {
    _cache.memos = savedMemos;
  } else {
    _cache.memos = DEFAULT_MEMOS.map(m => ({ ...m }));
    writeLocal(STORAGE_KEYS.MEMOS, _cache.memos);
  }

  const savedEmailCfg = readLocal(STORAGE_KEYS.EMAIL_CONFIG, null);
  _cache.emailConfig = savedEmailCfg && typeof savedEmailCfg === 'object'
    ? { ...DEFAULT_EMAIL_CONFIG, ...savedEmailCfg }
    : { ...DEFAULT_EMAIL_CONFIG };

  const savedEmailLogs = readLocal(STORAGE_KEYS.EMAIL_LOGS, null);
  _cache.emailLogs = Array.isArray(savedEmailLogs) ? savedEmailLogs : [];
}

async function loadAllData() {
  // Load initial cache from localStorage first for instant UI
  _cache.bookings = readLocal(STORAGE_KEYS.BOOKINGS, []);
  _cache.blockedSchedules = readLocal(STORAGE_KEYS.BLOCKED_SCHEDULES, []);
  const savedWeekly = readLocal(STORAGE_KEYS.WEEKLY_BLOCKED, null);
  _cache.weeklyBlocks = Array.isArray(savedWeekly) && savedWeekly.length > 0 ? savedWeekly : [...DEFAULT_WEEKLY_BLOCKED];
  loadOpsLocalData();

  if (!db) return;

  try {
    const [bRes, blkRes, wblkRes] = await Promise.all([
      db.from('bookings').select('*').order('createdAt', { ascending: false }),
      db.from('blocked_schedules').select('*'),
      db.from('weekly_blocks').select('*')
    ]);

    if (bRes.data) {
      _cache.bookings = bRes.data;
      writeLocal(STORAGE_KEYS.BOOKINGS, bRes.data);
    }
    if (blkRes.data) {
      _cache.blockedSchedules = blkRes.data;
      writeLocal(STORAGE_KEYS.BLOCKED_SCHEDULES, blkRes.data);
    }
    if (wblkRes.data) {
      if (wblkRes.data.length === 0) {
        const { data } = await db.from('weekly_blocks').insert(DEFAULT_WEEKLY_BLOCKED).select();
        if (data) _cache.weeklyBlocks = data;
      } else {
        _cache.weeklyBlocks = wblkRes.data;
      }
      writeLocal(STORAGE_KEYS.WEEKLY_BLOCKED, _cache.weeklyBlocks);
    }
  } catch (err) {
    console.warn('Supabase 데이터 동기화 중 로컬 캐시 유지:', err);
  }
}

function subscribeRealtime(onDataUpdated) {
  if (!db) return;

  try {
    db.channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async () => {
        const { data } = await db.from('bookings').select('*').order('createdAt', { ascending: false });
        if (data) {
          _cache.bookings = data;
          writeLocal(STORAGE_KEYS.BOOKINGS, data);
          onDataUpdated();
        }
      }).subscribe();

    db.channel('public:blocked_schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_schedules' }, async () => {
        const { data } = await db.from('blocked_schedules').select('*');
        if (data) {
          _cache.blockedSchedules = data;
          writeLocal(STORAGE_KEYS.BLOCKED_SCHEDULES, data);
          onDataUpdated();
        }
      }).subscribe();

    db.channel('public:weekly_blocks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_blocks' }, async () => {
        const { data } = await db.from('weekly_blocks').select('*');
        if (data) {
          _cache.weeklyBlocks = data;
          writeLocal(STORAGE_KEYS.WEEKLY_BLOCKED, data);
          onDataUpdated();
        }
      }).subscribe();
  } catch (err) {
    console.warn('Realtime subscription warning:', err);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 3. Date, Schedule Blocking & Validation Utilities
// ──────────────────────────────────────────────────────────────────────────
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatKoreanDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = KOREAN_WEEKDAYS[dateObj.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

function isDateBlocked(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  // 1. Weekly recurring full-day block
  if (_cache.weeklyBlocks.some(item => Number(item.dayOfWeek) === dayOfWeek && item.time === 'ALL')) {
    return true;
  }

  // 2. Specific single-day full-day block
  return _cache.blockedSchedules.some(item => item.date === dateStr && item.time === 'ALL');
}

function isTimeBlocked(dateStr, timeStr) {
  if (!dateStr || !timeStr) return true;
  if (isDateBlocked(dateStr)) return true;

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  // 1. Fixed weekly lesson / block
  if (_cache.weeklyBlocks.some(item => Number(item.dayOfWeek) === dayOfWeek && (item.time === timeStr || item.time === 'ALL'))) {
    return true;
  }

  // 2. Specific manual studio block
  if (_cache.blockedSchedules.some(item => item.date === dateStr && (item.time === timeStr || item.time === 'ALL'))) {
    return true;
  }

  // 3. Existing customer booking (excluding declined)
  return _cache.bookings.some(b => b.date === dateStr && b.time === timeStr && b.status !== 'declined');
}

function formatPhoneNumber(val) {
  const clean = val.replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
}

// ──────────────────────────────────────────────────────────────────────────
// 4. DOM Initialization (Router + Booking System)
// ──────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // === A. Standalone Multi-View Router ===
  const views = document.querySelectorAll('.page-view');
  const navTabs = document.querySelectorAll('.nav-tab[data-goto]');
  const drawerTabs = document.querySelectorAll('.drawer-tab[data-goto]');
  const gotoTriggers = document.querySelectorAll('[data-goto]');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');

  const validViews = new Set(Array.from(views).map(v => v.getAttribute('data-view')));

  function closeMobileDrawer() {
    if (mobileDrawer && mobileDrawer.classList.contains('open')) {
      mobileDrawer.classList.remove('open');
      if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function isAdminAuthenticated() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  }

  function setAdminAuthenticated(flag) {
    try {
      if (flag) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      else sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore sessionStorage errors
    }
  }

  let onAdminEnterCallback = null;

  function switchView(viewId, updateHash = true) {
    const requestedId = validViews.has(viewId) ? viewId : 'home';

    if (requestedId === 'admin' && !isAdminAuthenticated()) {
      openStaffAuthModal();
      const anyActive = Array.from(views).some(v => v.classList.contains('active'));
      if (!anyActive) {
        switchView('home', false);
      }
      return;
    }

    const targetId = requestedId;

    views.forEach(view => {
      view.classList.toggle('active', view.getAttribute('data-view') === targetId);
    });
    navTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-goto') === targetId);
    });
    drawerTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-goto') === targetId);
    });

    closeMobileDrawer();
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (targetId === 'admin' && typeof onAdminEnterCallback === 'function') {
      onAdminEnterCallback();
    }

    if (updateHash) {
      const nextHash = `#${targetId}`;
      if (window.location.hash !== nextHash) {
        history.pushState({ view: targetId }, '', nextHash);
      }
    }
  }

  gotoTriggers.forEach(el => {
    el.addEventListener('click', () => {
      const targetView = el.getAttribute('data-goto');
      if (targetView) switchView(targetView, true);
    });
  });

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function syncFromHash() {
    const rawHash = window.location.hash.replace('#', '').trim();
    const viewId = validViews.has(rawHash) ? rawHash : 'home';
    switchView(viewId, false);
  }

  // === B. Staff Only Security Login Modal ===
  const staffOnlyBtn = document.getElementById('staffOnlyBtn');
  const staffModal = document.getElementById('staffModal');
  const staffModalClose = document.getElementById('staffModalClose');
  const staffLoginForm = document.getElementById('staffLoginForm');
  const staffPwInput = document.getElementById('staffPwInput');
  const staffPwError = document.getElementById('staffPwError');

  function getCustomAdminPassword() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_PW);
      return raw ? String(raw) : '';
    } catch {
      return '';
    }
  }

  function verifyAdminPassword(inputPw) {
    const customPw = getCustomAdminPassword();
    if (customPw.length > 0) {
      return inputPw === customPw;
    }
    return DEFAULT_ADMIN_PASSWORDS.includes(inputPw);
  }

  function openStaffAuthModal() {
    if (!staffModal) return;
    if (staffPwInput) staffPwInput.value = '';
    if (staffPwError) staffPwError.style.display = 'none';
    staffModal.style.display = 'flex';
    setTimeout(() => {
      if (staffPwInput) staffPwInput.focus();
    }, 60);
  }

  function closeStaffAuthModal() {
    if (!staffModal) return;
    staffModal.style.display = 'none';
    if (staffPwInput) staffPwInput.value = '';
    if (staffPwError) staffPwError.style.display = 'none';
  }

  if (staffOnlyBtn && staffModal) {
    staffOnlyBtn.addEventListener('click', () => {
      if (isAdminAuthenticated()) {
        switchView('admin', true);
      } else {
        openStaffAuthModal();
      }
    });
    if (staffModalClose) {
      staffModalClose.addEventListener('click', closeStaffAuthModal);
    }
    staffModal.addEventListener('click', (e) => {
      if (e.target === staffModal) closeStaffAuthModal();
    });
  }

  if (staffLoginForm) {
    staffLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = staffPwInput ? staffPwInput.value.trim() : '';
      if (verifyAdminPassword(val)) {
        setAdminAuthenticated(true);
        closeStaffAuthModal();
        switchView('admin', true);
      } else {
        if (staffPwError) staffPwError.style.display = 'block';
        if (staffPwInput) {
          staffPwInput.value = '';
          staffPwInput.focus();
        }
      }
    });
  }

  window.addEventListener('hashchange', syncFromHash);
  window.addEventListener('popstate', syncFromHash);
  syncFromHash();

  // === C. Live Consultation Booking Widget ===
  const el = {
    formView: document.getElementById('formView'),
    completeView: document.getElementById('completeView'),
    consultationForm: document.getElementById('consultationForm'),

    inquiryTypeCards: document.querySelectorAll('.type-card'),
    lessonSubPanel: document.getElementById('lessonSubPanel'),
    workSubPanel: document.getElementById('workSubPanel'),
    lessonSubChips: document.querySelectorAll('#lessonSubPanel .sub-chip'),
    workSubChips: document.querySelectorAll('#workSubPanel .sub-chip'),

    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    currentMonthLabel: document.getElementById('currentMonthLabel'),
    calendarDaysGrid: document.getElementById('calendarDaysGrid'),
    selectedDateDisplay: document.getElementById('selectedDateDisplay'),
    timeSlotGrid: document.getElementById('timeSlotGrid'),
    intervalBtns: document.querySelectorAll('#view-booking .interval-btn[data-interval]'),
    datetimeError: document.getElementById('datetimeError'),

    userName: document.getElementById('userName'),
    nameError: document.getElementById('nameError'),
    userPhone: document.getElementById('userPhone'),
    phoneError: document.getElementById('phoneError'),
    userNotes: document.getElementById('userNotes'),
    contactChips: document.querySelectorAll('.method-chip'),

    reviewType: document.getElementById('reviewType'),
    reviewDate: document.getElementById('reviewDate'),
    reviewTime: document.getElementById('reviewTime'),
    reviewName: document.getElementById('reviewName'),
    reviewMethod: document.getElementById('reviewMethod'),
    reviewPhone: document.getElementById('reviewPhone'),
    reviewNotes: document.getElementById('reviewNotes'),
    submitBookingBtn: document.getElementById('submitBookingBtn'),

    ticketId: document.getElementById('ticketId'),
    ticketType: document.getElementById('ticketType'),
    ticketDateTime: document.getElementById('ticketDateTime'),
    ticketName: document.getElementById('ticketName'),
    ticketMethod: document.getElementById('ticketMethod'),
    ticketNotes: document.getElementById('ticketNotes'),
    downloadIcsBtn: document.getElementById('downloadIcsBtn'),
    kakaoChannelBtn: document.getElementById('kakaoChannelBtn'),
    resetBookingBtn: document.getElementById('resetBookingBtn')
  };

  if (!el.consultationForm) return;

  function getFullInquiryTypeLabel() {
    return bookingState.selectedSubType
      ? `${bookingState.selectedMainType} · ${bookingState.selectedSubType}`
      : bookingState.selectedMainType;
  }

  function updateReviewCard() {
    if (el.reviewType) el.reviewType.textContent = getFullInquiryTypeLabel();
    if (el.reviewDate) {
      el.reviewDate.textContent = bookingState.selectedDate
        ? formatKoreanDate(bookingState.selectedDate)
        : '날짜를 선택해 주세요';
    }
    if (el.reviewTime) {
      el.reviewTime.textContent = bookingState.selectedTime
        ? bookingState.selectedTime
        : '시간을 선택해 주세요';
    }

    const nameVal = el.userName ? el.userName.value.trim() : '';
    if (el.reviewName) el.reviewName.textContent = nameVal ? `${nameVal} 님` : '-';
    if (el.reviewMethod) el.reviewMethod.textContent = bookingState.contactMethod;

    const phoneVal = el.userPhone ? el.userPhone.value.trim() : '';
    if (el.reviewPhone) el.reviewPhone.textContent = phoneVal || '-';

    const notesVal = el.userNotes ? el.userNotes.value.trim() : '';
    if (el.reviewNotes) el.reviewNotes.textContent = notesVal || '(작성 내용 없음)';
  }

  function renderCalendar() {
    if (!el.calendarDaysGrid || !el.currentMonthLabel) return;

    const year = bookingState.currentCalendarMonth.getFullYear();
    const month = bookingState.currentCalendarMonth.getMonth();
    el.currentMonthLabel.textContent = `${year}년 ${month + 1}월`;

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    el.calendarDaysGrid.innerHTML = '';

    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'day-cell disabled';
      el.calendarDaysGrid.appendChild(emptyCell);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    for (let day = 1; day <= lastDate; day++) {
      const dayBtn = document.createElement('button');
      dayBtn.type = 'button';
      dayBtn.className = 'day-cell';
      dayBtn.textContent = day;

      const cellDate = new Date(year, month, day);
      const dateStr = formatDate(cellDate);
      const dayOfWeek = cellDate.getDay();

      if (dayOfWeek === 0) dayBtn.classList.add('sun');
      if (dayOfWeek === 6) dayBtn.classList.add('sat');

      const isPast = cellDate.getTime() < today.getTime();
      const isFullDayOff = isDateBlocked(dateStr);

      if (isPast || isFullDayOff) {
        dayBtn.classList.add('disabled');
        dayBtn.disabled = true;
        if (isFullDayOff) dayBtn.title = '휴무 또는 예약 마감일입니다.';
      } else {
        if (dateStr === todayStr) dayBtn.classList.add('today');
        if (dateStr === bookingState.selectedDate) dayBtn.classList.add('selected');

        dayBtn.addEventListener('click', () => {
          bookingState.selectedDate = dateStr;
          bookingState.selectedTime = null;
          if (el.datetimeError) el.datetimeError.style.display = 'none';
          if (el.selectedDateDisplay) el.selectedDateDisplay.textContent = formatKoreanDate(dateStr);
          renderCalendar();
          renderTimeSlots();
          updateReviewCard();
        });
      }

      el.calendarDaysGrid.appendChild(dayBtn);
    }
  }

  function renderTimeSlots() {
    if (!el.timeSlotGrid) return;
    el.timeSlotGrid.innerHTML = '';

    if (!bookingState.selectedDate) {
      el.timeSlotGrid.innerHTML = `
        <div class="no-slots-msg">
          📅 좌측 달력에서 상담을 원하시는 날짜를<br>먼저 선택해 주세요.
        </div>
      `;
      return;
    }

    const slots = bookingState.timeInterval === 60 ? TIME_SLOTS_60 : TIME_SLOTS_30;

    slots.forEach(time => {
      const slotBtn = document.createElement('button');
      slotBtn.type = 'button';
      slotBtn.className = 'slot-btn';

      const blocked = isTimeBlocked(bookingState.selectedDate, time);

      if (blocked) {
        slotBtn.classList.add('booked');
        slotBtn.disabled = true;
        slotBtn.title = '고정 레슨, 휴무 또는 이미 예약된 시간입니다.';
        slotBtn.innerHTML = `<span>${time}</span><span class="slot-status-tag">마감</span>`;
      } else {
        slotBtn.textContent = time;
        if (bookingState.selectedTime === time) {
          slotBtn.classList.add('selected');
        }
        slotBtn.addEventListener('click', () => {
          bookingState.selectedTime = time;
          if (el.datetimeError) el.datetimeError.style.display = 'none';
          renderTimeSlots();
          updateReviewCard();
        });
      }

      el.timeSlotGrid.appendChild(slotBtn);
    });
  }

  function showCompleteView(booking) {
    if (el.ticketId) el.ticketId.textContent = `#${booking.id}`;
    if (el.ticketType) el.ticketType.textContent = booking.type;
    if (el.ticketDateTime) el.ticketDateTime.textContent = `${formatKoreanDate(booking.date)} ${booking.time}`;
    if (el.ticketName) el.ticketName.textContent = `${booking.name} 님`;
    if (el.ticketMethod) {
      const maskedPhone = booking.phone.replace(/(\d{3})-\d{4}-(\d{4})/, '$1-****-$2');
      el.ticketMethod.textContent = `${booking.contactMethod} (${maskedPhone})`;
    }
    if (el.ticketNotes) el.ticketNotes.textContent = booking.notes || '특이사항 없음';

    if (el.formView) el.formView.style.display = 'none';
    if (el.completeView) el.completeView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function downloadIcsCalendar(booking) {
    if (!booking) return;

    const [y, m, d] = booking.date.split('-').map(Number);
    const [hour, minute] = booking.time.split(':').map(Number);

    const startDate = new Date(y, m - 1, d, hour, minute);
    const endDate = new Date(startDate.getTime() + 20 * 60 * 1000);
    const formatIcsTime = (dt) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IMAP Studio Consultation//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.id}@imapstudio.kr`,
      `DTSTAMP:${formatIcsTime(new Date())}`,
      `DTSTART:${formatIcsTime(startDate)}`,
      `DTEND:${formatIcsTime(endDate)}`,
      `SUMMARY:[대면상담신청] IMAP Studio - ${booking.type}`,
      `LOCATION:경기도 광명시 도덕로 56, 중앙하이츠상가동 3층 304호 (IMAP 스튜디오)`,
      `DESCRIPTION:신청자: ${booking.name}\\n연락처: ${booking.phone}\\n선호연락: ${booking.contactMethod}`,
      'STATUS:TENTATIVE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IMAP스튜디오_상담예약_${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Inquiry Type & Sub Chips Events
  el.inquiryTypeCards.forEach(card => {
    card.addEventListener('click', () => {
      el.inquiryTypeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        bookingState.selectedMainType = radio.value;
      }

      if (bookingState.selectedMainType === '레슨 상담') {
        if (el.lessonSubPanel) el.lessonSubPanel.classList.add('active');
        if (el.workSubPanel) el.workSubPanel.classList.remove('active');
        const activeChip = el.lessonSubPanel && el.lessonSubPanel.querySelector('.sub-chip.selected');
        bookingState.selectedSubType = activeChip ? activeChip.getAttribute('data-value') : '통기타 (어쿠스틱)';
      } else {
        if (el.workSubPanel) el.workSubPanel.classList.add('active');
        if (el.lessonSubPanel) el.lessonSubPanel.classList.remove('active');
        const activeChip = el.workSubPanel && el.workSubPanel.querySelector('.sub-chip.selected');
        bookingState.selectedSubType = activeChip ? activeChip.getAttribute('data-value') : '편곡 · 악보';
      }

      updateReviewCard();
    });
  });

  el.lessonSubChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.lessonSubChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      bookingState.selectedSubType = chip.getAttribute('data-value');
      updateReviewCard();
    });
  });

  el.workSubChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.workSubChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      bookingState.selectedSubType = chip.getAttribute('data-value');
      updateReviewCard();
    });
  });

  // Calendar Navigation & Time Interval Toggle
  if (el.prevMonthBtn) {
    el.prevMonthBtn.addEventListener('click', () => {
      bookingState.currentCalendarMonth.setMonth(bookingState.currentCalendarMonth.getMonth() - 1);
      renderCalendar();
    });
  }

  if (el.nextMonthBtn) {
    el.nextMonthBtn.addEventListener('click', () => {
      bookingState.currentCalendarMonth.setMonth(bookingState.currentCalendarMonth.getMonth() + 1);
      renderCalendar();
    });
  }

  el.intervalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.intervalBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bookingState.timeInterval = Number(btn.getAttribute('data-interval')) || 30;
      if (bookingState.timeInterval === 60 && bookingState.selectedTime && bookingState.selectedTime.endsWith(':30')) {
        bookingState.selectedTime = null;
      }
      renderTimeSlots();
      updateReviewCard();
    });
  });

  // Applicant Input Listeners
  if (el.userName) {
    el.userName.addEventListener('input', () => {
      if (el.nameError) el.nameError.style.display = 'none';
      updateReviewCard();
    });
  }

  if (el.userNotes) {
    el.userNotes.addEventListener('input', updateReviewCard);
  }

  if (el.userPhone) {
    el.userPhone.addEventListener('input', (e) => {
      e.target.value = formatPhoneNumber(e.target.value);
      if (el.phoneError) el.phoneError.style.display = 'none';
      updateReviewCard();
    });
  }

  el.contactChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.contactChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const radio = chip.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        bookingState.contactMethod = radio.value;
      }
      updateReviewCard();
    });
  });

  // Form Submission
  el.consultationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (bookingState.isSubmitting) return;

    let hasError = false;

    if (!bookingState.selectedDate || !bookingState.selectedTime || isTimeBlocked(bookingState.selectedDate, bookingState.selectedTime)) {
      if (el.datetimeError) el.datetimeError.style.display = 'block';
      hasError = true;
    } else if (el.datetimeError) {
      el.datetimeError.style.display = 'none';
    }

    const name = el.userName ? el.userName.value.trim() : '';
    if (!name) {
      if (el.nameError) el.nameError.style.display = 'block';
      if (!hasError && el.userName) el.userName.focus();
      hasError = true;
    } else if (el.nameError) {
      el.nameError.style.display = 'none';
    }

    const phone = el.userPhone ? el.userPhone.value.trim() : '';
    const phoneRegex = /^01[016789]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phone || !phoneRegex.test(phone)) {
      if (el.phoneError) el.phoneError.style.display = 'block';
      if (!hasError && el.userPhone) el.userPhone.focus();
      hasError = true;
    } else if (el.phoneError) {
      el.phoneError.style.display = 'none';
    }

    if (hasError) return;

    bookingState.isSubmitting = true;
    if (el.submitBookingBtn) {
      el.submitBookingBtn.disabled = true;
      el.submitBookingBtn.textContent = '예약 접수 중...';
    }

    const now = new Date();
    const bookingId = 'RES-'
      + now.getFullYear()
      + String(now.getMonth() + 1).padStart(2, '0')
      + String(now.getDate()).padStart(2, '0')
      + '-'
      + Math.floor(1000 + Math.random() * 9000);

    const newBooking = {
      id: bookingId,
      type: getFullInquiryTypeLabel(),
      mainType: bookingState.selectedMainType,
      subType: bookingState.selectedSubType,
      date: bookingState.selectedDate,
      time: bookingState.selectedTime,
      name: name,
      contactMethod: bookingState.contactMethod,
      phone: phone,
      notes: el.userNotes ? el.userNotes.value.trim() : '',
      createdAt: now.toISOString(),
      status: 'pending'
    };

    const notifyAndRefreshAfterSubmit = () => {
      _cache.bookings.unshift(newBooking);
      writeLocal(STORAGE_KEYS.BOOKINGS, _cache.bookings);
      bookingState.lastSubmitted = newBooking;

      renderCalendar();
      renderTimeSlots();
      updateFooterPendingBadge();
      refreshAdminPanels();
      showCompleteView(newBooking);

      // Instant serverless email notification to admin
      sendBookingNotificationEmail(newBooking, false).catch(err => {
        console.warn('이메일 알림 전송 중 경고:', err);
      });
    };

    try {
      if (db) {
        const { error } = await db.from('bookings').insert([newBooking]);
        if (error) throw error;
      }
      notifyAndRefreshAfterSubmit();
    } catch (err) {
      console.error('예약 저장 오류 (로컬 폴백 적용):', err);
      notifyAndRefreshAfterSubmit();
    } finally {
      bookingState.isSubmitting = false;
      if (el.submitBookingBtn) {
        el.submitBookingBtn.disabled = false;
        el.submitBookingBtn.textContent = '대면 상담 예약 신청하기 →';
      }
    }
  });

  // Ticket Action Buttons
  if (el.downloadIcsBtn) {
    el.downloadIcsBtn.addEventListener('click', () => {
      downloadIcsCalendar(bookingState.lastSubmitted);
    });
  }

  if (el.kakaoChannelBtn) {
    el.kakaoChannelBtn.addEventListener('click', () => {
      const channelUrl = `http://pf.kakao.com/${bookingState.kakaoChannelId}/chat`;
      if (confirm('카카오톡 채널 채팅방으로 이동하시겠습니까?')) {
        window.open(channelUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }

  if (el.resetBookingBtn) {
    el.resetBookingBtn.addEventListener('click', () => {
      bookingState.selectedDate = null;
      bookingState.selectedTime = null;
      el.consultationForm.reset();

      el.inquiryTypeCards.forEach(c => c.classList.remove('selected'));
      if (el.inquiryTypeCards[0]) el.inquiryTypeCards[0].classList.add('selected');
      bookingState.selectedMainType = '레슨 상담';
      if (el.lessonSubPanel) el.lessonSubPanel.classList.add('active');
      if (el.workSubPanel) el.workSubPanel.classList.remove('active');
      el.lessonSubChips.forEach(c => c.classList.remove('selected'));
      if (el.lessonSubChips[0]) el.lessonSubChips[0].classList.add('selected');
      bookingState.selectedSubType = '통기타 (어쿠스틱)';

      el.contactChips.forEach(c => c.classList.remove('selected'));
      if (el.contactChips[0]) el.contactChips[0].classList.add('selected');
      bookingState.contactMethod = '카카오톡';

      if (el.selectedDateDisplay) el.selectedDateDisplay.textContent = '날짜를 먼저 선택하세요';
      if (el.completeView) el.completeView.style.display = 'none';
      if (el.formView) el.formView.style.display = 'block';

      renderCalendar();
      renderTimeSlots();
      updateReviewCard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Address Copy Button
  const copyAddressBtn = document.getElementById('copyAddressBtn');
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(STUDIO_ADDRESS);
        } else {
          const tempInput = document.createElement('textarea');
          tempInput.value = STUDIO_ADDRESS;
          tempInput.style.position = 'fixed';
          tempInput.style.opacity = '0';
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
        copyAddressBtn.classList.add('copied');
        copyAddressBtn.textContent = '✓ 주소가 복사되었습니다';
        setTimeout(() => {
          copyAddressBtn.classList.remove('copied');
          copyAddressBtn.textContent = '📋 주소 복사';
        }, 2000);
      } catch (err) {
        alert('주소: ' + STUDIO_ADDRESS);
      }
    });
  }

  // ========================================================================
  // D. Serverless Instant Email Notification Engine
  // ========================================================================
  const emailEl = {
    enabled: document.getElementById('emailNotifyEnabled'),
    recipient: document.getElementById('notifyEmailInput'),
    provider: document.getElementById('emailProviderSelect'),
    gasFields: document.getElementById('gasConfigFields'),
    gasWebhookUrl: document.getElementById('gasWebhookUrlInput'),
    gasCodeSnippet: document.getElementById('gasCodeSnippet'),
    copyGasCodeBtn: document.getElementById('copyGasCodeBtn'),
    emailjsFields: document.getElementById('emailjsConfigFields'),
    emailjsServiceId: document.getElementById('emailjsServiceId'),
    emailjsTemplateId: document.getElementById('emailjsTemplateId'),
    emailjsPublicKey: document.getElementById('emailjsPublicKey'),
    formsubmitFields: document.getElementById('formsubmitConfigFields'),
    saveBtn: document.getElementById('saveEmailConfigBtn'),
    testBtn: document.getElementById('testEmailSendBtn'),
    statusBanner: document.getElementById('emailTestStatus'),
    logList: document.getElementById('emailNotificationLog')
  };

  function toggleProviderFields(provider) {
    if (emailEl.gasFields) emailEl.gasFields.style.display = provider === 'gas' ? 'block' : 'none';
    if (emailEl.emailjsFields) emailEl.emailjsFields.style.display = provider === 'emailjs' ? 'block' : 'none';
    if (emailEl.formsubmitFields) emailEl.formsubmitFields.style.display = provider === 'formsubmit' ? 'block' : 'none';
  }

  function renderEmailConfigForm() {
    const cfg = _cache.emailConfig || DEFAULT_EMAIL_CONFIG;
    if (emailEl.enabled) emailEl.enabled.checked = cfg.enabled !== false;
    if (emailEl.recipient) emailEl.recipient.value = cfg.recipientEmail || 'jeje1120@nate.com';
    if (emailEl.provider) {
      emailEl.provider.value = cfg.provider || 'gas';
      toggleProviderFields(emailEl.provider.value);
    }
    if (emailEl.gasWebhookUrl) emailEl.gasWebhookUrl.value = cfg.gasWebhookUrl || '';
    if (emailEl.emailjsServiceId) emailEl.emailjsServiceId.value = cfg.emailjsServiceId || '';
    if (emailEl.emailjsTemplateId) emailEl.emailjsTemplateId.value = cfg.emailjsTemplateId || '';
    if (emailEl.emailjsPublicKey) emailEl.emailjsPublicKey.value = cfg.emailjsPublicKey || '';
  }

  function readEmailConfigFromForm() {
    const cfg = {
      enabled: emailEl.enabled ? emailEl.enabled.checked : true,
      recipientEmail: emailEl.recipient ? emailEl.recipient.value.trim() || 'jeje1120@nate.com' : 'jeje1120@nate.com',
      provider: emailEl.provider ? emailEl.provider.value : 'gas',
      gasWebhookUrl: emailEl.gasWebhookUrl ? emailEl.gasWebhookUrl.value.trim() : '',
      emailjsServiceId: emailEl.emailjsServiceId ? emailEl.emailjsServiceId.value.trim() : '',
      emailjsTemplateId: emailEl.emailjsTemplateId ? emailEl.emailjsTemplateId.value.trim() : '',
      emailjsPublicKey: emailEl.emailjsPublicKey ? emailEl.emailjsPublicKey.value.trim() : ''
    };
    _cache.emailConfig = cfg;
    writeLocal(STORAGE_KEYS.EMAIL_CONFIG, cfg);
    return cfg;
  }

  function showEmailStatusBanner(type, text) {
    if (!emailEl.statusBanner) return;
    emailEl.statusBanner.className = `email-status-banner ${type}`;
    emailEl.statusBanner.textContent = text;
    emailEl.statusBanner.style.display = 'block';
  }

  function appendEmailLog(entry) {
    _cache.emailLogs.unshift(entry);
    if (_cache.emailLogs.length > 20) _cache.emailLogs = _cache.emailLogs.slice(0, 20);
    writeLocal(STORAGE_KEYS.EMAIL_LOGS, _cache.emailLogs);
    renderEmailLogs();
  }

  function renderEmailLogs() {
    if (!emailEl.logList) return;
    const logs = _cache.emailLogs || [];
    if (logs.length === 0) {
      emailEl.logList.innerHTML = '<div class="email-log-item"><span style="color: var(--text-dim);">아직 발송된 이메일 알림 기록이 없습니다.</span></div>';
      return;
    }
    emailEl.logList.innerHTML = logs.map(log => `
      <div class="email-log-item">
        <span><strong>${escapeHtml(log.bookingId)}</strong> · ${escapeHtml(log.summary)}</span>
        <span style="color: ${log.ok ? '#99F6E4' : '#FCA5A5'}; white-space: nowrap;">${escapeHtml(log.statusText)} (${escapeHtml(log.timeLabel)})</span>
      </div>
    `).join('');
  }

  async function sendBookingNotificationEmail(booking, isTest = false) {
    const cfg = isTest
      ? readEmailConfigFromForm()
      : (_cache.emailConfig || readLocal(STORAGE_KEYS.EMAIL_CONFIG, DEFAULT_EMAIL_CONFIG));
    const nowTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    if (!isTest && !cfg.enabled) {
      appendEmailLog({
        bookingId: `#${booking.id}`,
        summary: `${booking.name} (${booking.date} ${booking.time})`,
        ok: false,
        statusText: '알림 비활성화됨',
        timeLabel: nowTime
      });
      return { ok: false, reason: '이메일 알림이 비활성화되어 있습니다.' };
    }

    const payload = {
      to_email: cfg.recipientEmail,
      booking_id: booking.id,
      user_name: booking.name,
      user_phone: booking.phone,
      contact_method: booking.contactMethod,
      booking_date: formatKoreanDate(booking.date) || booking.date,
      booking_time: booking.time,
      inquiry_type: booking.type,
      user_notes: booking.notes || '(메모 없음)',
      created_at: booking.createdAt || new Date().toISOString(),
      studio_address: STUDIO_ADDRESS,
      subject: isTest
        ? `[IMAP Studio 테스트] 관리자 이메일 알림 연동 테스트 (#${booking.id})`
        : `[IMAP Studio 새 상담 예약] ${booking.name} 님 (${booking.date} ${booking.time})`,
      message: [
        isTest ? '[IMAP Studio 관리자 이메일 알림 테스트]' : '[IMAP Studio 새로운 대면 상담 예약 접수]',
        `예약번호: #${booking.id}`,
        `신청자: ${booking.name}`,
        `연락처: ${booking.phone} (선호: ${booking.contactMethod})`,
        `희망 일시: ${formatKoreanDate(booking.date)} ${booking.time}`,
        `상담/악기 유형: ${booking.type}`,
        `문의 메모: ${booking.notes || '없음'}`,
        `스튜디오 위치: ${STUDIO_ADDRESS}`
      ].join('\n')
    };

    try {
      if (cfg.provider === 'gas') {
        if (!cfg.gasWebhookUrl) {
          const msg = 'Google Apps Script 웹 앱 URL이 미입력 상태입니다.';
          appendEmailLog({ bookingId: `#${booking.id}`, summary: `${booking.name} (${cfg.recipientEmail})`, ok: false, statusText: 'URL 미설정', timeLabel: nowTime });
          return { ok: false, reason: msg };
        }
        try {
          const res = await fetch(cfg.gasWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (corsOrNetErr) {
          // Google Apps Script often blocks reading CORS response; retry with no-cors fire-and-forget
          await fetch(cfg.gasWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
        }
        appendEmailLog({ bookingId: `#${booking.id}`, summary: `${booking.name} → ${cfg.recipientEmail}`, ok: true, statusText: 'GAS 발송 요청 완료', timeLabel: nowTime });
        return { ok: true, reason: `${cfg.recipientEmail} 주소로 Google Apps Script 알림 전송을 요청했습니다.` };
      }

      if (cfg.provider === 'emailjs') {
        if (!cfg.emailjsServiceId || !cfg.emailjsTemplateId || !cfg.emailjsPublicKey) {
          const msg = 'EmailJS Service ID, Template ID, Public Key를 모두 입력해 주세요.';
          appendEmailLog({ bookingId: `#${booking.id}`, summary: `${booking.name} → ${cfg.recipientEmail}`, ok: false, statusText: '키 미설정', timeLabel: nowTime });
          return { ok: false, reason: msg };
        }
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: cfg.emailjsServiceId,
            template_id: cfg.emailjsTemplateId,
            user_id: cfg.emailjsPublicKey,
            template_params: payload
          })
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`EmailJS 오류 (${res.status}) ${errText}`);
        }
        appendEmailLog({ bookingId: `#${booking.id}`, summary: `${booking.name} → ${cfg.recipientEmail}`, ok: true, statusText: 'EmailJS 발송 완료', timeLabel: nowTime });
        return { ok: true, reason: `EmailJS를 통해 ${cfg.recipientEmail}로 알림 메일이 발송되었습니다.` };
      }

      if (cfg.provider === 'formsubmit') {
        if (!cfg.recipientEmail) {
          return { ok: false, reason: '수신 이메일 주소를 입력해 주세요.' };
        }
        const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(cfg.recipientEmail)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: payload.subject,
            _template: 'table',
            예약번호: `#${payload.booking_id}`,
            신청자: payload.user_name,
            연락처: payload.user_phone,
            선호연락방법: payload.contact_method,
            희망일시: `${payload.booking_date} ${payload.booking_time}`,
            상담유형: payload.inquiry_type,
            문의메모: payload.user_notes,
            접수일시: payload.created_at,
            스튜디오위치: payload.studio_address
          })
        });
        if (!res.ok) throw new Error(`FormSubmit HTTP ${res.status}`);
        appendEmailLog({ bookingId: `#${booking.id}`, summary: `${booking.name} → ${cfg.recipientEmail}`, ok: true, statusText: 'FormSubmit 발송 완료', timeLabel: nowTime });
        return { ok: true, reason: `FormSubmit.co를 통해 ${cfg.recipientEmail}로 알림이 발송되었습니다.` };
      }

      return { ok: false, reason: '지원되지 않는 발송 방식입니다.' };
    } catch (err) {
      appendEmailLog({ bookingId: `#${booking.id}`, summary: `${booking.name} → ${cfg.recipientEmail}`, ok: false, statusText: '발송 실패', timeLabel: nowTime });
      return { ok: false, reason: `발송 중 오류: ${err.message || err}` };
    }
  }

  // ========================================================================
  // E. Staff Only Integrated Admin Hub (#view-admin)
  // ========================================================================
  const adminEl = {
    footerPendingBadge: document.getElementById('footerPendingBadge'),
    statPending: document.getElementById('adminStatPending'),
    statConfirmed: document.getElementById('adminStatConfirmed'),
    statBlocked: document.getElementById('adminStatBlocked'),
    statTodo: document.getElementById('adminStatTodo'),
    openPwChangeBtn: document.getElementById('openPwChangeBtn'),
    logoutBtn: document.getElementById('adminLogoutBtn'),

    tabBtnReservations: document.getElementById('adminTabBtnReservations'),
    tabBtnOperations: document.getElementById('adminTabBtnOperations'),
    totalBookingsBadge: document.getElementById('adminTotalBookingsBadge'),
    panelReservations: document.getElementById('adminPanelReservations'),
    panelOperations: document.getElementById('adminPanelOperations'),

    filterBtns: document.querySelectorAll('.admin-filter-btn'),
    searchInput: document.getElementById('adminBookingSearch'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    bookingsTableBody: document.getElementById('adminBookingsTableBody'),

    blockModeSingleBtn: document.getElementById('blockModeSingleBtn'),
    blockModeWeeklyBtn: document.getElementById('blockModeWeeklyBtn'),
    singleBlockPanel: document.getElementById('singleBlockPanel'),
    weeklyBlockPanel: document.getElementById('weeklyBlockPanel'),
    blockDateInput: document.getElementById('blockDateInput'),
    blockTimeSelect: document.getElementById('blockTimeSelect'),
    blockReasonInput: document.getElementById('blockReasonInput'),
    addBlockBtn: document.getElementById('addBlockBtn'),
    quickLockDateLabel: document.getElementById('quickLockDateLabel'),
    quickSlotLockGrid: document.getElementById('quickSlotLockGrid'),
    singleBlockCountSpan: document.getElementById('singleBlockCountSpan'),
    blockedListBody: document.getElementById('blockedListBody'),

    btnDaysAll: document.getElementById('btnDaysAll'),
    btnDaysWeekday: document.getElementById('btnDaysWeekday'),
    btnDaysWeekend: document.getElementById('btnDaysWeekend'),
    btnDaysClear: document.getElementById('btnDaysClear'),
    btnTimesAll: document.getElementById('btnTimesAll'),
    btnTimesMorning: document.getElementById('btnTimesMorning'),
    btnTimesEvening: document.getElementById('btnTimesEvening'),
    btnTimesClear: document.getElementById('btnTimesClear'),
    weeklyReasonInput: document.getElementById('weeklyReasonInput'),
    selectedDaysCount: document.getElementById('selectedDaysCount'),
    selectedTimesCount: document.getElementById('selectedTimesCount'),
    totalCombinationsCount: document.getElementById('totalCombinationsCount'),
    addWeeklyBlockBtn: document.getElementById('addWeeklyBlockBtn'),
    weeklyBlockCountSpan: document.getElementById('weeklyBlockCountSpan'),
    weeklyBlockListBody: document.getElementById('weeklyBlockListBody'),

    pwChangeCard: document.getElementById('adminPwChangeCard'),
    newAdminPwInput: document.getElementById('newAdminPwInput'),
    confirmAdminPwInput: document.getElementById('confirmAdminPwInput'),
    saveAdminPwBtn: document.getElementById('saveAdminPwBtn'),
    resetAdminPwBtn: document.getElementById('resetAdminPwBtn'),
    adminPwChangeMsg: document.getElementById('adminPwChangeMsg'),

    ttIntervalBtns: document.querySelectorAll('#view-admin .interval-btn[data-tt-interval]'),
    openAddLessonBtn: document.getElementById('openAddLessonBtn'),
    addLessonQuickBar: document.getElementById('addLessonQuickBar'),
    ttStudentInput: document.getElementById('ttStudentInput'),
    ttSubjectSelect: document.getElementById('ttSubjectSelect'),
    ttFormatSelect: document.getElementById('ttFormatSelect'),
    ttDaySelect: document.getElementById('ttDaySelect'),
    ttTimeSelect: document.getElementById('ttTimeSelect'),
    ttSyncBlockCheck: document.getElementById('ttSyncBlockCheck'),
    confirmAddLessonBtn: document.getElementById('confirmAddLessonBtn'),
    opsTimetableContainer: document.getElementById('opsTimetableContainer'),

    todoProgressBadge: document.getElementById('todoProgressBadge'),
    todoTagSelect: document.getElementById('todoTagSelect'),
    todoTextInput: document.getElementById('todoTextInput'),
    addTodoBtn: document.getElementById('addTodoBtn'),
    todoListContainer: document.getElementById('todoListContainer'),
    clearCompletedTodosBtn: document.getElementById('clearCompletedTodosBtn'),

    memoCategorySelect: document.getElementById('memoCategorySelect'),
    memoTitleInput: document.getElementById('memoTitleInput'),
    memoContentInput: document.getElementById('memoContentInput'),
    addMemoBtn: document.getElementById('addMemoBtn'),
    memoListContainer: document.getElementById('memoListContainer')
  };

  function updateFooterPendingBadge() {
    const pendingCount = _cache.bookings.filter(b => b.status === 'pending').length;
    if (adminEl.footerPendingBadge) {
      if (pendingCount > 0) {
        adminEl.footerPendingBadge.textContent = pendingCount;
        adminEl.footerPendingBadge.style.display = 'inline-flex';
      } else {
        adminEl.footerPendingBadge.style.display = 'none';
      }
    }
  }

  function updateAdminStats() {
    updateFooterPendingBadge();
    const pendingCount = _cache.bookings.filter(b => b.status === 'pending').length;
    const confirmedCount = _cache.bookings.filter(b => b.status === 'confirmed').length;
    const blockedTotal = _cache.blockedSchedules.length + _cache.weeklyBlocks.length;
    const openTodoCount = _cache.todos.filter(t => !t.done).length;

    if (adminEl.statPending) adminEl.statPending.textContent = pendingCount;
    if (adminEl.statConfirmed) adminEl.statConfirmed.textContent = confirmedCount;
    if (adminEl.statBlocked) adminEl.statBlocked.textContent = blockedTotal;
    if (adminEl.statTodo) adminEl.statTodo.textContent = openTodoCount;
    if (adminEl.totalBookingsBadge) adminEl.totalBookingsBadge.textContent = _cache.bookings.length;
  }

  function switchAdminTab(tabKey) {
    adminState.activeTab = tabKey === 'operations' ? 'operations' : 'reservations';
    const isRes = adminState.activeTab === 'reservations';
    if (adminEl.tabBtnReservations) {
      adminEl.tabBtnReservations.classList.toggle('active', isRes);
      adminEl.tabBtnReservations.setAttribute('aria-selected', String(isRes));
    }
    if (adminEl.tabBtnOperations) {
      adminEl.tabBtnOperations.classList.toggle('active', !isRes);
      adminEl.tabBtnOperations.setAttribute('aria-selected', String(!isRes));
    }
    if (adminEl.panelReservations) adminEl.panelReservations.style.display = isRes ? 'block' : 'none';
    if (adminEl.panelOperations) adminEl.panelOperations.style.display = isRes ? 'none' : 'block';
  }

  // --- Tab 1A: Reservations List & Status Controls ---
  function renderAdminBookingsTable() {
    if (!adminEl.bookingsTableBody) return;

    const sorted = [..._cache.bookings].sort((a, b) => {
      const da = a.createdAt || '';
      const dbStr = b.createdAt || '';
      return dbStr.localeCompare(da);
    });

    const query = adminState.bookingSearch.trim().toLowerCase();
    const filtered = sorted.filter(item => {
      if (adminState.bookingFilter !== 'all' && item.status !== adminState.bookingFilter) {
        return false;
      }
      if (!query) return true;
      const hay = `${item.id} ${item.name} ${item.phone} ${item.type} ${item.date} ${item.time} ${item.notes || ''}`.toLowerCase();
      return hay.includes(query);
    });

    if (filtered.length === 0) {
      adminEl.bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 28px; color: var(--text-muted);">
            조건에 해당하는 대면 상담 예약 내역이 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    adminEl.bookingsTableBody.innerHTML = filtered.map(item => {
      let statusBadge = '<span class="status-badge pending">신청 대기</span>';
      if (item.status === 'confirmed') statusBadge = '<span class="status-badge confirmed">예약 확정</span>';
      else if (item.status === 'completed') statusBadge = '<span class="status-badge completed">상담 완료</span>';
      else if (item.status === 'declined') statusBadge = '<span class="status-badge declined">예약 취소(슬롯 복구)</span>';

      const createdFormatted = item.createdAt ? item.createdAt.substring(0, 16).replace('T', ' ') : '-';

      return `
        <tr>
          <td>
            <span class="booking-id-code">#${escapeHtml(item.id)}</span>
            <span class="booking-created-sub">${escapeHtml(createdFormatted)}</span>
          </td>
          <td>
            <strong>${escapeHtml(item.name)}</strong> 님
            <span class="booking-created-sub">${escapeHtml(item.contactMethod)} · ${escapeHtml(item.phone)}</span>
          </td>
          <td>
            <strong>${escapeHtml(formatKoreanDate(item.date) || item.date)}</strong>
            <span class="booking-created-sub">⏰ ${escapeHtml(item.time)}</span>
          </td>
          <td>${escapeHtml(item.type)}</td>
          <td class="booking-memo-cell">${escapeHtml(item.notes || '-')}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="admin-action-cell">
              ${item.status !== 'confirmed' ? `<button type="button" class="btn-admin-act confirm" data-act="confirm" data-id="${escapeHtml(item.id)}">예약 확정</button>` : ''}
              ${item.status !== 'completed' ? `<button type="button" class="btn-admin-act complete" data-act="complete" data-id="${escapeHtml(item.id)}">상담 완료</button>` : ''}
              ${item.status !== 'declined' ? `<button type="button" class="btn-admin-act decline" data-act="decline" data-id="${escapeHtml(item.id)}">예약 취소(슬롯 복구)</button>` : ''}
              <button type="button" class="btn-admin-act delete" data-act="delete" data-id="${escapeHtml(item.id)}">삭제</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    adminEl.bookingsTableBody.querySelectorAll('button[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.getAttribute('data-act');
        const id = btn.getAttribute('data-id');
        handleAdminBookingAction(act, id);
      });
    });
  }

  async function handleAdminBookingAction(act, id) {
    const target = _cache.bookings.find(b => b.id === id);
    if (!target) return;

    if (act === 'decline') {
      if (!confirm(`[${target.name} 님] (${target.date} ${target.time}) 예약을 취소하시겠습니까?\n취소 시 해당 시간대가 방문자 예약 캘린더에 다시 복구됩니다.`)) {
        return;
      }
    } else if (act === 'delete') {
      if (!confirm(`[#${target.id}] 예약 내역을 영구 삭제하시겠습니까?`)) {
        return;
      }
    }

    let nextStatus = target.status;
    if (act === 'confirm') nextStatus = 'confirmed';
    else if (act === 'complete') nextStatus = 'completed';
    else if (act === 'decline') nextStatus = 'declined';

    try {
      if (db) {
        if (act === 'delete') {
          const { error } = await db.from('bookings').delete().eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await db.from('bookings').update({ status: nextStatus }).eq('id', id);
          if (error) throw error;
        }
      }
    } catch (err) {
      console.warn('Supabase 예약 상태 업데이트 실패 (로컬 상태 반영):', err);
    }

    if (act === 'delete') {
      _cache.bookings = _cache.bookings.filter(b => b.id !== id);
    } else {
      target.status = nextStatus;
    }

    writeLocal(STORAGE_KEYS.BOOKINGS, _cache.bookings);
    renderCalendar();
    renderTimeSlots();
    refreshAdminPanels();
  }

  function exportBookingsCsv() {
    if (_cache.bookings.length === 0) {
      alert('내보낼 예약 내역이 없습니다.');
      return;
    }
    const BOM = '\uFEFF';
    const headers = ['예약번호', '상태', '상담유형', '희망날짜', '희망시간', '신청자', '선호연락', '연락처', '메모', '접수일시'];
    const rows = _cache.bookings.map(b => [
      `"${b.id}"`,
      `"${b.status}"`,
      `"${b.type || ''}"`,
      `"${b.date || ''}"`,
      `"${b.time || ''}"`,
      `"${b.name || ''}"`,
      `"${b.contactMethod || ''}"`,
      `"${b.phone || ''}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
      `"${b.createdAt || ''}"`
    ]);
    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IMAP스튜디오_상담예약_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // --- Tab 1B: Manual Slot Blocking & Weekly Recurring Blocks ---
  function renderQuickSlotLockGrid() {
    if (!adminEl.quickSlotLockGrid || !adminEl.blockDateInput) return;
    if (!adminEl.blockDateInput.value) {
      adminEl.blockDateInput.value = formatDate(new Date());
    }
    const dateStr = adminEl.blockDateInput.value;
    if (adminEl.quickLockDateLabel) {
      adminEl.quickLockDateLabel.textContent = formatKoreanDate(dateStr) || dateStr;
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();

    const allDayManual = _cache.blockedSchedules.find(item => item.date === dateStr && item.time === 'ALL');
    const allDayWeekly = _cache.weeklyBlocks.find(item => Number(item.dayOfWeek) === dayOfWeek && item.time === 'ALL');

    let html = '';
    if (allDayWeekly) {
      html += `
        <button type="button" class="quick-lock-btn all-day is-external-blocked" disabled>
          <span>🚫 매주 ${KOREAN_WEEKDAYS[dayOfWeek]}요일 정기 휴무 (고정 차단됨)</span>
          <span class="quick-lock-sub">${escapeHtml(allDayWeekly.reason || '정기 휴무')}</span>
        </button>
      `;
    } else if (allDayManual) {
      html += `
        <button type="button" class="quick-lock-btn all-day is-locked" data-quick-time="ALL" data-block-id="${escapeHtml(allDayManual.id)}">
          <span>🔒 하루 종일 예약 마감 (${escapeHtml(allDayManual.reason || '휴무일')})</span>
          <span class="quick-lock-sub">클릭하여 전일 잠금 해제</span>
        </button>
      `;
    } else {
      html += `
        <button type="button" class="quick-lock-btn all-day" data-quick-time="ALL">
          <span>📅 ${escapeHtml(dateStr)} 하루 종일 휴무로 일괄 마감하기</span>
          <span class="quick-lock-sub">클릭 시 해당 날짜 전체 마감</span>
        </button>
      `;
    }

    TIME_SLOTS_30.forEach(time => {
      const manualItem = _cache.blockedSchedules.find(item => item.date === dateStr && item.time === time);
      const weeklyItem = _cache.weeklyBlocks.find(item => Number(item.dayOfWeek) === dayOfWeek && (item.time === time || item.time === 'ALL'));
      const bookingItem = _cache.bookings.find(b => b.date === dateStr && b.time === time && b.status !== 'declined');

      if (weeklyItem || allDayManual || bookingItem) {
        const subText = bookingItem
          ? `예약(${bookingItem.name})`
          : allDayManual
            ? '전일 마감중'
            : `고정(${weeklyItem.reason || '레슨'})`;
        html += `
          <button type="button" class="quick-lock-btn is-external-blocked" disabled title="${escapeHtml(subText)}">
            <span>${time}</span>
            <span class="quick-lock-sub">${escapeHtml(subText.slice(0, 10))}</span>
          </button>
        `;
      } else if (manualItem) {
        html += `
          <button type="button" class="quick-lock-btn is-locked" data-quick-time="${time}" data-block-id="${escapeHtml(manualItem.id)}" title="${escapeHtml(manualItem.reason || '관리자 마감')}">
            <span>🔒 ${time}</span>
            <span class="quick-lock-sub">마감 (해제)</span>
          </button>
        `;
      } else {
        html += `
          <button type="button" class="quick-lock-btn" data-quick-time="${time}">
            <span>${time}</span>
            <span class="quick-lock-sub">예약 가능</span>
          </button>
        `;
      }
    });

    adminEl.quickSlotLockGrid.innerHTML = html;

    adminEl.quickSlotLockGrid.querySelectorAll('button[data-quick-time]:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', async () => {
        const existingId = btn.getAttribute('data-block-id');
        const targetTime = btn.getAttribute('data-quick-time');
        if (existingId) {
          await removeBlockedSchedule(existingId, true);
        } else {
          const reason = (adminEl.blockReasonInput && adminEl.blockReasonInput.value.trim())
            || (targetTime === 'ALL' ? '스튜디오 휴무일' : '관리자 수동 마감');
          await insertBlockedSchedule(dateStr, targetTime, reason, true);
        }
      });
    });
  }

  async function insertBlockedSchedule(dateVal, timeVal, reasonVal, silent = false) {
    if (!dateVal) {
      alert('차단할 날짜를 선택해 주세요.');
      return;
    }
    const exists = _cache.blockedSchedules.some(b => b.date === dateVal && b.time === timeVal);
    if (exists) {
      if (!silent) alert('이미 해당 날짜·시간이 마감 차단되어 있습니다.');
      return;
    }

    const newBlock = {
      id: 'blk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      date: dateVal,
      time: timeVal,
      reason: reasonVal || '스튜디오 일정/휴무'
    };

    try {
      if (db) {
        const { error } = await db.from('blocked_schedules').insert([newBlock]);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase 차단 저장 실패 (로컬 저장):', err);
    }

    _cache.blockedSchedules.push(newBlock);
    writeLocal(STORAGE_KEYS.BLOCKED_SCHEDULES, _cache.blockedSchedules);
    renderCalendar();
    renderTimeSlots();
    refreshAdminPanels();

    if (!silent && adminEl.blockReasonInput) {
      adminEl.blockReasonInput.value = '';
      document.querySelectorAll('.reason-preset-chip[data-target="blockReasonInput"]').forEach(c => c.classList.remove('active-preset'));
    }
  }

  async function removeBlockedSchedule(id, silent = false) {
    if (!silent && !confirm('이 예약 차단 잠금을 해제하여 방문자가 다시 예약할 수 있게 할까요?')) {
      return;
    }
    try {
      if (db) {
        const { error } = await db.from('blocked_schedules').delete().eq('id', id);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase 차단 해제 실패 (로컬 반영):', err);
    }
    _cache.blockedSchedules = _cache.blockedSchedules.filter(item => item.id !== id);
    writeLocal(STORAGE_KEYS.BLOCKED_SCHEDULES, _cache.blockedSchedules);
    renderCalendar();
    renderTimeSlots();
    refreshAdminPanels();
  }

  function renderBlockedListTable() {
    if (!adminEl.blockedListBody) return;
    const list = [..._cache.blockedSchedules].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (adminEl.singleBlockCountSpan) adminEl.singleBlockCountSpan.textContent = list.length;

    if (list.length === 0) {
      adminEl.blockedListBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
            등록된 특정 날짜 수동 마감 일정이 없습니다.
          </td>
        </tr>
      `;
    } else {
      adminEl.blockedListBody.innerHTML = list.map(item => `
        <tr>
          <td><strong>${escapeHtml(formatKoreanDate(item.date) || item.date)}</strong></td>
          <td>${item.time === 'ALL' ? '<span class="status-badge declined">하루 종일 (휴무)</span>' : `<strong>${escapeHtml(item.time)}</strong>`}</td>
          <td>${escapeHtml(item.reason || '-')}</td>
          <td><span class="status-badge confirmed">마감 차단중</span></td>
          <td><button type="button" class="btn-admin-act decline remove-single-block-btn" data-id="${escapeHtml(item.id)}">잠금 해제</button></td>
        </tr>
      `).join('');

      adminEl.blockedListBody.querySelectorAll('.remove-single-block-btn').forEach(btn => {
        btn.addEventListener('click', () => removeBlockedSchedule(btn.getAttribute('data-id')));
      });
    }

    renderWeeklyBlockedListTable();
  }

  function renderWeeklyBlockedListTable() {
    if (!adminEl.weeklyBlockListBody) return;
    const list = [..._cache.weeklyBlocks].sort((a, b) => {
      const da = Number(a.dayOfWeek) === 0 ? 7 : Number(a.dayOfWeek);
      const dbNum = Number(b.dayOfWeek) === 0 ? 7 : Number(b.dayOfWeek);
      if (da !== dbNum) return da - dbNum;
      return String(a.time).localeCompare(String(b.time));
    });

    if (adminEl.weeklyBlockCountSpan) adminEl.weeklyBlockCountSpan.textContent = list.length;

    if (list.length === 0) {
      adminEl.weeklyBlockListBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
            등록된 매주 고정 레슨/차단 일정이 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    adminEl.weeklyBlockListBody.innerHTML = list.map(item => {
      const dayName = KOREAN_WEEKDAYS[Number(item.dayOfWeek)] || '-';
      return `
        <tr>
          <td><strong>매주 ${escapeHtml(dayName)}요일</strong></td>
          <td>${item.time === 'ALL' ? '<span class="status-badge declined">하루 종일 (정기 휴무)</span>' : `<strong>${escapeHtml(item.time)}</strong>`}</td>
          <td>${escapeHtml(item.reason || '정기 고정 레슨')}</td>
          <td><span class="status-badge confirmed">매주 반복</span></td>
          <td><button type="button" class="btn-admin-act decline remove-weekly-block-btn" data-id="${escapeHtml(item.id)}">해제</button></td>
        </tr>
      `;
    }).join('');

    adminEl.weeklyBlockListBody.querySelectorAll('.remove-weekly-block-btn').forEach(btn => {
      btn.addEventListener('click', () => removeWeeklyBlockedSchedule(btn.getAttribute('data-id')));
    });
  }

  function updateWeeklySelectionSummary() {
    const daysCount = document.querySelectorAll('input[name="weeklyDay"]:checked').length;
    const timesCount = document.querySelectorAll('input[name="weeklyTime"]:checked').length;
    const total = daysCount * timesCount;
    if (adminEl.selectedDaysCount) adminEl.selectedDaysCount.textContent = daysCount;
    if (adminEl.selectedTimesCount) adminEl.selectedTimesCount.textContent = timesCount;
    if (adminEl.totalCombinationsCount) adminEl.totalCombinationsCount.textContent = total;
  }

  async function addWeeklyBlockedSchedule() {
    const days = Array.from(document.querySelectorAll('input[name="weeklyDay"]:checked')).map(c => Number(c.value));
    const times = Array.from(document.querySelectorAll('input[name="weeklyTime"]:checked')).map(c => c.value);
    const reasonVal = (adminEl.weeklyReasonInput && adminEl.weeklyReasonInput.value.trim()) || '정기 고정 레슨';

    if (days.length === 0 || times.length === 0) {
      alert('반복 요일과 고정 시간을 각각 1개 이상 선택해 주세요.');
      return;
    }

    const toInsert = [];
    days.forEach(day => {
      times.forEach(time => {
        const exists = _cache.weeklyBlocks.some(item => Number(item.dayOfWeek) === day && item.time === time);
        if (!exists) {
          toInsert.push({
            id: 'wblk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            dayOfWeek: day,
            time,
            reason: reasonVal
          });
        }
      });
    });

    if (toInsert.length === 0) {
      alert('선택하신 요일·시간은 모두 이미 등록되어 있습니다.');
      return;
    }

    try {
      if (db) {
        const { error } = await db.from('weekly_blocks').insert(toInsert);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase 매주 고정레슨 저장 실패 (로컬 저장):', err);
    }

    _cache.weeklyBlocks.push(...toInsert);
    writeLocal(STORAGE_KEYS.WEEKLY_BLOCKED, _cache.weeklyBlocks);

    document.querySelectorAll('input[name="weeklyDay"], input[name="weeklyTime"]').forEach(c => { c.checked = false; });
    if (adminEl.weeklyReasonInput) adminEl.weeklyReasonInput.value = '';
    updateWeeklySelectionSummary();
    renderCalendar();
    renderTimeSlots();
    refreshAdminPanels();
    alert(`매주 반복 고정 일정 ${toInsert.length}건이 등록되었습니다.`);
  }

  async function removeWeeklyBlockedSchedule(id, silent = false) {
    const target = _cache.weeklyBlocks.find(item => item.id === id);
    if (!target) return;
    if (!silent && !confirm(`[매주 ${KOREAN_WEEKDAYS[Number(target.dayOfWeek)]}요일 ${target.time}] 고정 일정을 해제하시겠습니까?`)) {
      return;
    }
    try {
      if (db) {
        const { error } = await db.from('weekly_blocks').delete().eq('id', id);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase 매주 고정레슨 삭제 실패 (로컬 반영):', err);
    }
    _cache.weeklyBlocks = _cache.weeklyBlocks.filter(item => item.id !== id);
    if (_cache.timetableMeta[id]) {
      delete _cache.timetableMeta[id];
      writeLocal(STORAGE_KEYS.TIMETABLE_META, _cache.timetableMeta);
    }
    writeLocal(STORAGE_KEYS.WEEKLY_BLOCKED, _cache.weeklyBlocks);
    renderCalendar();
    renderTimeSlots();
    refreshAdminPanels();
  }

  // --- Tab 2: Operations Board (Drag & Drop Timetable + To-Do + Memos) ---
  function getTimetableCardDisplay(item) {
    const meta = _cache.timetableMeta[item.id];
    if (meta && (meta.student || meta.subject || meta.format)) {
      return meta;
    }
    const reason = String(item.reason || '정기 레슨');
    const matched = reason.match(/^(.*?)\s*\((.*?)\s*·\s*(.*?)\)$/);
    if (matched) {
      return { student: matched[1].trim(), subject: matched[2].trim(), format: matched[3].trim() };
    }
    return { student: reason, subject: '🎵 스튜디오 일정', format: item.source === 'extra' ? '내부메모' : '고정' };
  }

  function renderOpsTimetable() {
    if (!adminEl.opsTimetableContainer) return;

    const hours = adminState.ttInterval === 30 ? TIMETABLE_HOURS_30 : TIMETABLE_HOURS_60;
    const weeklyItems = _cache.weeklyBlocks.map(item => ({ ...item, source: 'weekly' }));
    const extraItems = _cache.timetableExtras.map(item => ({ ...item, source: 'extra' }));
    const allCards = [...weeklyItems, ...extraItems];

    const renderCardHtml = (card) => {
      const info = getTimetableCardDisplay(card);
      const isAll = card.time === 'ALL';
      const syncTag = card.source === 'weekly' ? '' : ' · 내부전용';
      return `
        <div class="ops-lesson-card ${isAll ? 'is-all-day' : ''}" draggable="true" data-card-id="${escapeHtml(card.id)}" data-card-source="${card.source}">
          <div class="ops-lesson-top">
            <span class="ops-lesson-name" title="${escapeHtml(info.student)}">${escapeHtml(info.student)}</span>
            <button type="button" class="ops-lesson-del" data-del-id="${escapeHtml(card.id)}" data-del-source="${card.source}" title="삭제">×</button>
          </div>
          <div class="ops-lesson-meta">
            <span>${escapeHtml(info.subject)}</span>
            <span class="ops-lesson-badge">${escapeHtml(info.format)}${card.time.endsWith(':30') && adminState.ttInterval === 60 ? ` ${card.time}` : ''}${syncTag}</span>
          </div>
        </div>
      `;
    };

    let html = `
      <table class="ops-timetable-table">
        <thead>
          <tr>
            <th class="col-time">시간</th>
            ${TIMETABLE_DAYS.map(d => `<th class="${d.isSat ? 'day-sat' : d.isSun ? 'day-sun' : ''}">${d.short}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="ops-tt-time-cell">종일</td>
            ${TIMETABLE_DAYS.map(d => {
              const cellCards = allCards.filter(c => Number(c.dayOfWeek) === d.day && c.time === 'ALL');
              return `<td class="ops-tt-cell" data-day="${d.day}" data-time="ALL">${cellCards.map(renderCardHtml).join('')}</td>`;
            }).join('')}
          </tr>
          ${hours.map(hourStr => {
            const hourPrefix = hourStr.slice(0, 2);
            return `
              <tr>
                <td class="ops-tt-time-cell">${hourStr}</td>
                ${TIMETABLE_DAYS.map(d => {
                  const cellCards = allCards.filter(c => {
                    if (Number(c.dayOfWeek) !== d.day || c.time === 'ALL') return false;
                    if (adminState.ttInterval === 30) return c.time === hourStr;
                    return c.time === hourStr || c.time === `${hourPrefix}:30`;
                  });
                  return `<td class="ops-tt-cell" data-day="${d.day}" data-time="${hourStr}">${cellCards.map(renderCardHtml).join('')}</td>`;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    adminEl.opsTimetableContainer.innerHTML = html;

    // Bind delete inside card
    adminEl.opsTimetableContainer.querySelectorAll('.ops-lesson-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const cardId = btn.getAttribute('data-del-id');
        const source = btn.getAttribute('data-del-source');
        if (source === 'weekly') {
          await removeWeeklyBlockedSchedule(cardId, false);
        } else {
          if (!confirm('이 시간표 일정을 삭제하시겠습니까?')) return;
          _cache.timetableExtras = _cache.timetableExtras.filter(x => x.id !== cardId);
          writeLocal(STORAGE_KEYS.TIMETABLE_EXTRA, _cache.timetableExtras);
          renderOpsTimetable();
        }
      });
    });

    // Bind Drag & Drop on cards
    adminEl.opsTimetableContainer.querySelectorAll('.ops-lesson-card').forEach(cardEl => {
      cardEl.addEventListener('dragstart', (e) => {
        adminState.draggedCardId = cardEl.getAttribute('data-card-id');
        adminState.draggedCardSource = cardEl.getAttribute('data-card-source');
        cardEl.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', adminState.draggedCardId || '');
        }
      });
      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('dragging');
        adminEl.opsTimetableContainer.querySelectorAll('.ops-tt-cell.drag-over').forEach(c => c.classList.remove('drag-over'));
      });
    });

    // Bind Drop targets & Click-to-prefill on timetable cells
    adminEl.opsTimetableContainer.querySelectorAll('.ops-tt-cell').forEach(cellEl => {
      cellEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        cellEl.classList.add('drag-over');
      });
      cellEl.addEventListener('dragleave', () => {
        cellEl.classList.remove('drag-over');
      });
      cellEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        cellEl.classList.remove('drag-over');
        const cardId = adminState.draggedCardId || (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '');
        const source = adminState.draggedCardSource || 'weekly';
        if (!cardId) return;

        const targetDay = Number(cellEl.getAttribute('data-day'));
        const targetTime = cellEl.getAttribute('data-time');
        await moveTimetableCard(cardId, source, targetDay, targetTime);
        adminState.draggedCardId = null;
        adminState.draggedCardSource = null;
      });

      cellEl.addEventListener('click', (e) => {
        if (e.target.closest('.ops-lesson-card')) return;
        const dayVal = cellEl.getAttribute('data-day');
        const timeVal = cellEl.getAttribute('data-time');
        if (adminEl.ttDaySelect && dayVal !== null) adminEl.ttDaySelect.value = dayVal;
        if (adminEl.ttTimeSelect && timeVal && timeVal !== 'ALL') adminEl.ttTimeSelect.value = timeVal;
        if (adminEl.addLessonQuickBar) adminEl.addLessonQuickBar.style.display = 'block';
        if (adminEl.ttStudentInput) adminEl.ttStudentInput.focus();
      });
    });
  }

  async function moveTimetableCard(cardId, source, targetDay, targetTime) {
    const list = source === 'weekly' ? _cache.weeklyBlocks : _cache.timetableExtras;
    const item = list.find(x => x.id === cardId);
    if (!item) return;

    if (Number(item.dayOfWeek) === targetDay && item.time === targetTime) return;
    if (item.time === 'ALL' && targetTime !== 'ALL') {
      alert('하루 종일 휴무 카드는 상단 [종일] 줄의 다른 요일로만 이동할 수 있습니다.');
      return;
    }

    const conflict = [..._cache.weeklyBlocks, ..._cache.timetableExtras].some(other =>
      other.id !== cardId && Number(other.dayOfWeek) === targetDay && other.time === targetTime
    );
    if (conflict) {
      alert('이동하려는 요일·시간 칸에 이미 등록된 일정이 있습니다.');
      return;
    }

    item.dayOfWeek = targetDay;
    item.time = targetTime;

    if (source === 'weekly') {
      try {
        if (db) {
          const { error } = await db.from('weekly_blocks').update({ dayOfWeek: targetDay, time: targetTime }).eq('id', cardId);
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Supabase 시간표 드래그 이동 실패 (로컬 반영):', err);
      }
      writeLocal(STORAGE_KEYS.WEEKLY_BLOCKED, _cache.weeklyBlocks);
      renderCalendar();
      renderTimeSlots();
    } else {
      writeLocal(STORAGE_KEYS.TIMETABLE_EXTRA, _cache.timetableExtras);
    }

    refreshAdminPanels();
  }

  async function addTimetableLessonCard() {
    const student = (adminEl.ttStudentInput && adminEl.ttStudentInput.value.trim()) || '레슨/일정';
    const subject = adminEl.ttSubjectSelect ? adminEl.ttSubjectSelect.value : '🎸 통기타';
    const format = adminEl.ttFormatSelect ? adminEl.ttFormatSelect.value : '1대1';
    const dayOfWeek = adminEl.ttDaySelect ? Number(adminEl.ttDaySelect.value) : 1;
    const time = adminEl.ttTimeSelect ? adminEl.ttTimeSelect.value : '14:00';
    const syncToBooking = adminEl.ttSyncBlockCheck ? adminEl.ttSyncBlockCheck.checked : true;

    const conflict = [..._cache.weeklyBlocks, ..._cache.timetableExtras].some(item =>
      Number(item.dayOfWeek) === dayOfWeek && item.time === time
    );
    if (conflict) {
      alert('선택하신 요일·시간에는 이미 레슨/일정이 등록되어 있습니다.');
      return;
    }

    const prefix = syncToBooking ? 'wblk-' : 'ttx-';
    const newId = prefix + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const reasonStr = `${student} (${subject} · ${format})`;

    _cache.timetableMeta[newId] = { student, subject, format };
    writeLocal(STORAGE_KEYS.TIMETABLE_META, _cache.timetableMeta);

    const newItem = { id: newId, dayOfWeek, time, reason: reasonStr };

    if (syncToBooking) {
      try {
        if (db) {
          const { error } = await db.from('weekly_blocks').insert([newItem]);
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Supabase 시간표 추가 실패 (로컬 저장):', err);
      }
      _cache.weeklyBlocks.push(newItem);
      writeLocal(STORAGE_KEYS.WEEKLY_BLOCKED, _cache.weeklyBlocks);
      renderCalendar();
      renderTimeSlots();
    } else {
      _cache.timetableExtras.push(newItem);
      writeLocal(STORAGE_KEYS.TIMETABLE_EXTRA, _cache.timetableExtras);
    }

    if (adminEl.ttStudentInput) adminEl.ttStudentInput.value = '';
    refreshAdminPanels();
  }

  // --- Tab 2B: Studio Operational To-Do Checklist & Memos ---
  function renderOpsTodos() {
    if (!adminEl.todoListContainer) return;
    const todos = _cache.todos || [];
    const doneCount = todos.filter(t => t.done).length;
    if (adminEl.todoProgressBadge) {
      adminEl.todoProgressBadge.textContent = `${doneCount} / ${todos.length} 완료`;
    }

    if (todos.length === 0) {
      adminEl.todoListContainer.innerHTML = '<div style="text-align:center; padding:18px; color:var(--text-muted); font-size:13px;">등록된 스튜디오 운영 To-Do 항목이 없습니다.</div>';
      return;
    }

    adminEl.todoListContainer.innerHTML = todos.map(item => `
      <div class="todo-item-row ${item.done ? 'done' : ''}">
        <label class="todo-check-label">
          <input type="checkbox" class="todo-toggle-cb" data-id="${escapeHtml(item.id)}" ${item.done ? 'checked' : ''}>
          <span class="todo-tag-pill">${escapeHtml(item.tag || '일반')}</span>
          <span class="todo-item-text">${escapeHtml(item.text)}</span>
        </label>
        <button type="button" class="todo-del-btn" data-id="${escapeHtml(item.id)}" title="삭제">×</button>
      </div>
    `).join('');

    adminEl.todoListContainer.querySelectorAll('.todo-toggle-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id');
        const target = _cache.todos.find(t => t.id === id);
        if (target) {
          target.done = cb.checked;
          writeLocal(STORAGE_KEYS.TODOS, _cache.todos);
          renderOpsTodos();
          updateAdminStats();
        }
      });
    });

    adminEl.todoListContainer.querySelectorAll('.todo-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        _cache.todos = _cache.todos.filter(t => t.id !== id);
        writeLocal(STORAGE_KEYS.TODOS, _cache.todos);
        renderOpsTodos();
        updateAdminStats();
      });
    });
  }

  function addTodoItem() {
    const text = adminEl.todoTextInput ? adminEl.todoTextInput.value.trim() : '';
    if (!text) return;
    const tag = adminEl.todoTagSelect ? adminEl.todoTagSelect.value : '상담/일반';
    _cache.todos.unshift({
      id: 'todo-' + Date.now(),
      text,
      tag,
      done: false
    });
    writeLocal(STORAGE_KEYS.TODOS, _cache.todos);
    if (adminEl.todoTextInput) adminEl.todoTextInput.value = '';
    renderOpsTodos();
    updateAdminStats();
  }

  function renderOpsMemos() {
    if (!adminEl.memoListContainer) return;
    const memos = _cache.memos || [];
    if (memos.length === 0) {
      adminEl.memoListContainer.innerHTML = '<div style="text-align:center; padding:18px; color:var(--text-muted); font-size:13px;">등록된 스튜디오 공유 메모가 없습니다.</div>';
      return;
    }

    adminEl.memoListContainer.innerHTML = memos.map(item => `
      <div class="memo-item-card">
        <div class="memo-item-head">
          <div class="memo-item-meta">
            <span class="memo-cat-badge">${escapeHtml(item.category || '📌 운영공지')}</span>
            <span class="memo-date-text">${escapeHtml(item.date || '')}</span>
          </div>
          <button type="button" class="memo-del-btn" data-id="${escapeHtml(item.id)}" title="메모 삭제">×</button>
        </div>
        <div class="memo-item-title">${escapeHtml(item.title)}</div>
        <div class="memo-item-content">${escapeHtml(item.content)}</div>
      </div>
    `).join('');

    adminEl.memoListContainer.querySelectorAll('.memo-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('이 운영 메모를 삭제하시겠습니까?')) return;
        const id = btn.getAttribute('data-id');
        _cache.memos = _cache.memos.filter(m => m.id !== id);
        writeLocal(STORAGE_KEYS.MEMOS, _cache.memos);
        renderOpsMemos();
      });
    });
  }

  function addMemoItem() {
    const title = adminEl.memoTitleInput ? adminEl.memoTitleInput.value.trim() : '';
    const content = adminEl.memoContentInput ? adminEl.memoContentInput.value.trim() : '';
    if (!title && !content) {
      alert('메모 제목이나 내용을 입력해 주세요.');
      return;
    }
    const now = new Date();
    const dateLabel = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    const category = adminEl.memoCategorySelect ? adminEl.memoCategorySelect.value : '📌 운영공지';

    _cache.memos.unshift({
      id: 'memo-' + Date.now(),
      category,
      title: title || '운영 전달 메모',
      content: content || title,
      date: dateLabel
    });
    writeLocal(STORAGE_KEYS.MEMOS, _cache.memos);
    if (adminEl.memoTitleInput) adminEl.memoTitleInput.value = '';
    if (adminEl.memoContentInput) adminEl.memoContentInput.value = '';
    renderOpsMemos();
  }

  function renderAllAdminPanels() {
    updateAdminStats();
    renderAdminBookingsTable();
    renderQuickSlotLockGrid();
    renderBlockedListTable();
    renderEmailConfigForm();
    renderEmailLogs();
    renderOpsTimetable();
    renderOpsTodos();
    renderOpsMemos();
  }

  function refreshAdminPanels() {
    updateAdminStats();
    if (isAdminAuthenticated()) {
      renderAdminBookingsTable();
      renderQuickSlotLockGrid();
      renderBlockedListTable();
      renderOpsTimetable();
    }
  }

  onAdminEnterCallback = renderAllAdminPanels;

  // Bind Admin Hub Event Listeners
  if (adminEl.logoutBtn) {
    adminEl.logoutBtn.addEventListener('click', () => {
      setAdminAuthenticated(false);
      switchView('home', true);
    });
  }

  if (adminEl.openPwChangeBtn && adminEl.pwChangeCard) {
    adminEl.openPwChangeBtn.addEventListener('click', () => {
      switchAdminTab('reservations');
      adminEl.pwChangeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (adminEl.newAdminPwInput) adminEl.newAdminPwInput.focus();
    });
  }

  if (adminEl.tabBtnReservations) {
    adminEl.tabBtnReservations.addEventListener('click', () => switchAdminTab('reservations'));
  }
  if (adminEl.tabBtnOperations) {
    adminEl.tabBtnOperations.addEventListener('click', () => {
      switchAdminTab('operations');
      renderOpsTimetable();
    });
  }

  adminEl.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      adminEl.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      adminState.bookingFilter = btn.getAttribute('data-filter') || 'all';
      renderAdminBookingsTable();
    });
  });

  if (adminEl.searchInput) {
    adminEl.searchInput.addEventListener('input', () => {
      adminState.bookingSearch = adminEl.searchInput.value;
      renderAdminBookingsTable();
    });
  }

  if (adminEl.exportCsvBtn) {
    adminEl.exportCsvBtn.addEventListener('click', exportBookingsCsv);
  }

  if (adminEl.blockModeSingleBtn && adminEl.blockModeWeeklyBtn) {
    adminEl.blockModeSingleBtn.addEventListener('click', () => {
      adminEl.blockModeSingleBtn.classList.add('active');
      adminEl.blockModeWeeklyBtn.classList.remove('active');
      if (adminEl.singleBlockPanel) adminEl.singleBlockPanel.style.display = 'block';
      if (adminEl.weeklyBlockPanel) adminEl.weeklyBlockPanel.style.display = 'none';
    });
    adminEl.blockModeWeeklyBtn.addEventListener('click', () => {
      adminEl.blockModeWeeklyBtn.classList.add('active');
      adminEl.blockModeSingleBtn.classList.remove('active');
      if (adminEl.weeklyBlockPanel) adminEl.weeklyBlockPanel.style.display = 'block';
      if (adminEl.singleBlockPanel) adminEl.singleBlockPanel.style.display = 'none';
    });
  }

  if (adminEl.blockDateInput) {
    adminEl.blockDateInput.value = formatDate(new Date());
    adminEl.blockDateInput.addEventListener('change', renderQuickSlotLockGrid);
  }

  if (adminEl.addBlockBtn) {
    adminEl.addBlockBtn.addEventListener('click', () => {
      const d = adminEl.blockDateInput ? adminEl.blockDateInput.value : '';
      const t = adminEl.blockTimeSelect ? adminEl.blockTimeSelect.value : 'ALL';
      const r = adminEl.blockReasonInput ? adminEl.blockReasonInput.value.trim() : '';
      insertBlockedSchedule(d, t, r, false);
    });
  }

  document.querySelectorAll('.reason-preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetId = chip.getAttribute('data-target');
      const preset = chip.getAttribute('data-preset');
      const inputEl = document.getElementById(targetId);
      if (inputEl && preset) {
        inputEl.value = preset;
        const parentRow = chip.closest('.reason-preset-row');
        if (parentRow) parentRow.querySelectorAll('.reason-preset-chip').forEach(c => c.classList.remove('active-preset'));
        chip.classList.add('active-preset');
      }
    });
  });

  // Weekly Multi-select Controls
  document.querySelectorAll('input[name="weeklyDay"], input[name="weeklyTime"]').forEach(cb => {
    cb.addEventListener('change', updateWeeklySelectionSummary);
  });
  if (adminEl.btnDaysAll) adminEl.btnDaysAll.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyDay"]').forEach(c => { c.checked = true; });
    updateWeeklySelectionSummary();
  });
  if (adminEl.btnDaysWeekday) adminEl.btnDaysWeekday.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyDay"]').forEach(c => {
      const v = Number(c.value);
      c.checked = v >= 1 && v <= 5;
    });
    updateWeeklySelectionSummary();
  });
  if (adminEl.btnDaysWeekend) adminEl.btnDaysWeekend.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyDay"]').forEach(c => {
      const v = Number(c.value);
      c.checked = v === 0 || v === 6;
    });
    updateWeeklySelectionSummary();
  });
  if (adminEl.btnDaysClear) adminEl.btnDaysClear.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyDay"]').forEach(c => { c.checked = false; });
    updateWeeklySelectionSummary();
  });

  if (adminEl.btnTimesAll) adminEl.btnTimesAll.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyTime"]').forEach(c => {
      c.checked = c.value !== 'ALL' && c.value.endsWith(':00');
    });
    updateWeeklySelectionSummary();
  });
  if (adminEl.btnTimesMorning) adminEl.btnTimesMorning.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyTime"]').forEach(c => {
      if (c.value === 'ALL') { c.checked = false; return; }
      const h = parseInt(c.value.split(':')[0], 10);
      c.checked = h >= 10 && h <= 14;
    });
    updateWeeklySelectionSummary();
  });
  if (adminEl.btnTimesEvening) adminEl.btnTimesEvening.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyTime"]').forEach(c => {
      if (c.value === 'ALL') { c.checked = false; return; }
      const h = parseInt(c.value.split(':')[0], 10);
      c.checked = h >= 15 && h <= 20;
    });
    updateWeeklySelectionSummary();
  });
  if (adminEl.btnTimesClear) adminEl.btnTimesClear.addEventListener('click', () => {
    document.querySelectorAll('input[name="weeklyTime"]').forEach(c => { c.checked = false; });
    updateWeeklySelectionSummary();
  });
  if (adminEl.addWeeklyBlockBtn) {
    adminEl.addWeeklyBlockBtn.addEventListener('click', addWeeklyBlockedSchedule);
  }

  // Email Settings Events
  if (emailEl.provider) {
    emailEl.provider.addEventListener('change', () => toggleProviderFields(emailEl.provider.value));
  }
  if (emailEl.copyGasCodeBtn && emailEl.gasCodeSnippet) {
    emailEl.copyGasCodeBtn.addEventListener('click', async () => {
      const codeText = emailEl.gasCodeSnippet.textContent || '';
      try {
        await navigator.clipboard.writeText(codeText);
        emailEl.copyGasCodeBtn.textContent = '✓ Apps Script 코드가 복사되었습니다';
        setTimeout(() => { emailEl.copyGasCodeBtn.textContent = '📋 Apps Script 코드 복사'; }, 2000);
      } catch {
        alert('코드를 직접 드래그하여 복사해 주세요.');
      }
    });
  }
  if (emailEl.saveBtn) {
    emailEl.saveBtn.addEventListener('click', () => {
      const cfg = readEmailConfigFromForm();
      showEmailStatusBanner('success', `이메일 알림 설정이 저장되었습니다. (수신: ${cfg.recipientEmail} · 방식: ${cfg.provider.toUpperCase()})`);
    });
  }
  if (emailEl.testBtn) {
    emailEl.testBtn.addEventListener('click', async () => {
      emailEl.testBtn.disabled = true;
      emailEl.testBtn.textContent = '테스트 메일 발송 중...';
      showEmailStatusBanner('info', '테스트 이메일을 전송하고 있습니다...');
      const sampleBooking = {
        id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        name: '테스트 신청자',
        phone: '010-0000-0000',
        contactMethod: '카카오톡',
        date: formatDate(new Date()),
        time: '14:00',
        type: '레슨 상담 · 통기타 (어쿠스틱)',
        notes: '관리자 허브에서 보낸 이메일 즉시 알림 테스트입니다.',
        createdAt: new Date().toISOString()
      };
      const result = await sendBookingNotificationEmail(sampleBooking, true);
      showEmailStatusBanner(result.ok ? 'success' : 'error', result.reason);
      emailEl.testBtn.disabled = false;
      emailEl.testBtn.textContent = '✉️ 테스트 이메일 즉시 발송';
    });
  }

  // Password Change Events
  if (adminEl.saveAdminPwBtn) {
    adminEl.saveAdminPwBtn.addEventListener('click', () => {
      const npw = adminEl.newAdminPwInput ? adminEl.newAdminPwInput.value.trim() : '';
      const cpw = adminEl.confirmAdminPwInput ? adminEl.confirmAdminPwInput.value.trim() : '';
      if (npw.length < 4) {
        if (adminEl.adminPwChangeMsg) adminEl.adminPwChangeMsg.textContent = '비밀번호는 4자 이상으로 입력해 주세요.';
        return;
      }
      if (npw !== cpw) {
        if (adminEl.adminPwChangeMsg) adminEl.adminPwChangeMsg.textContent = '새 비밀번호와 확인 입력이 일치하지 않습니다.';
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PW, npw);
      } catch {}
      if (adminEl.newAdminPwInput) adminEl.newAdminPwInput.value = '';
      if (adminEl.confirmAdminPwInput) adminEl.confirmAdminPwInput.value = '';
      if (adminEl.adminPwChangeMsg) adminEl.adminPwChangeMsg.textContent = '✓ 새 관리자 비밀번호가 저장되었습니다.';
    });
  }

  if (adminEl.resetAdminPwBtn) {
    adminEl.resetAdminPwBtn.addEventListener('click', () => {
      if (!confirm('관리자 비밀번호를 초기 설정(백업 비밀번호 / 0000 / imap2026)으로 복원하시겠습니까?')) return;
      try {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_PW);
      } catch {}
      if (adminEl.adminPwChangeMsg) adminEl.adminPwChangeMsg.textContent = '✓ 초기 비밀번호 설정으로 복원되었습니다.';
    });
  }

  // Tab 2: Operations Events
  adminEl.ttIntervalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      adminEl.ttIntervalBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      adminState.ttInterval = Number(btn.getAttribute('data-tt-interval')) || 60;
      renderOpsTimetable();
    });
  });

  if (adminEl.openAddLessonBtn && adminEl.addLessonQuickBar) {
    adminEl.openAddLessonBtn.addEventListener('click', () => {
      adminEl.addLessonQuickBar.style.display = 'block';
      if (adminEl.ttStudentInput) adminEl.ttStudentInput.focus();
    });
  }

  if (adminEl.confirmAddLessonBtn) {
    adminEl.confirmAddLessonBtn.addEventListener('click', addTimetableLessonCard);
  }
  if (adminEl.ttStudentInput) {
    adminEl.ttStudentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTimetableLessonCard();
      }
    });
  }

  if (adminEl.addTodoBtn) adminEl.addTodoBtn.addEventListener('click', addTodoItem);
  if (adminEl.todoTextInput) {
    adminEl.todoTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTodoItem();
      }
    });
  }
  if (adminEl.clearCompletedTodosBtn) {
    adminEl.clearCompletedTodosBtn.addEventListener('click', () => {
      _cache.todos = _cache.todos.filter(t => !t.done);
      writeLocal(STORAGE_KEYS.TODOS, _cache.todos);
      renderOpsTodos();
      updateAdminStats();
    });
  }

  if (adminEl.addMemoBtn) adminEl.addMemoBtn.addEventListener('click', addMemoItem);

  // Bootstrap Booking + Admin Data & Initial Render
  await loadAllData();
  subscribeRealtime(() => {
    renderCalendar();
    renderTimeSlots();
    refreshAdminPanels();
  });

  renderCalendar();
  renderTimeSlots();
  updateReviewCard();
  renderEmailConfigForm();
  updateFooterPendingBadge();
  if (isAdminAuthenticated()) {
    renderAllAdminPanels();
  }

  // FullScore PC/모바일 자동 분기 링크 적용
  const FULLSCORE_PC_URL = 'https://www.fullscore.co.kr/shop/prd_search.php?prdname=%EC%9D%8C%EC%95%85%EB%86%80%EC%9D%B4%ED%84%B0&x=0&y=0';
  const FULLSCORE_MOBILE_URL = 'https://www.fullscore.co.kr/m/sub/prdsearch.php?prdname=%EC%9D%8C%EC%95%85%EB%86%80%EC%9D%B4%ED%84%B0&x=0&y=0';
  const syncFullScoreLinks = () => {
    const isMobile = /iPhone|Android.*Mobile|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 768;
    const targetUrl = isMobile ? FULLSCORE_MOBILE_URL : FULLSCORE_PC_URL;
    document.querySelectorAll('a[href*="fullscore.co.kr"]').forEach(link => {
      link.setAttribute('href', targetUrl);
    });
  };
  syncFullScoreLinks();
  window.addEventListener('resize', syncFullScoreLinks);
});
