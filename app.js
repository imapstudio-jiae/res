/**
 * IMAP Studio - Consultation Booking Application
 * Supabase 실시간 DB 연동 버전
 * ──────────────────────────────────────────────
 * ⚠️  아래 두 줄에 본인의 Supabase 프로젝트 정보를 입력하세요
 *    Project Settings → API 에서 확인할 수 있습니다.
 */
const SUPABASE_URL  = 'https://kntrffydktjflvgttnlt.supabase.co';
const SUPABASE_ANON = 'sb_publishable_WBNiCS21h_NTVBLOnKNJiw_o0R8BPc3';

// Supabase 클라이언트 초기화
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ──────────────────────────────────────────────
// 앱 내부 캐시 (Supabase 데이터를 메모리에 보관)
// ──────────────────────────────────────────────
let _cache = {
  bookings:         [],
  blockedSchedules: [],
  weeklyBlocks:     []
};

// STORAGE_KEYS는 더 이상 사용하지 않습니다 (Supabase로 대체)
const STORAGE_KEYS = {
  BOOKINGS: null,
  BLOCKED_SCHEDULES: null,
  WEEKLY_BLOCKED: 'imap_studio_weekly_blocks_v1'
};

// Initial default blocked schedules as example (e.g. regular lesson times)
const DEFAULT_BLOCKED_SCHEDULES = [
  { id: 'blk-3', date: getRelativeDateStr(3), time: 'ALL', reason: '스튜디오 휴무일' },
  { id: 'blk-4', date: getRelativeDateStr(4), time: '16:00', reason: '음원 녹음 세션' }
];

// Initial default recurring weekly blocked schedules (e.g. fixed regular lessons)
const DEFAULT_WEEKLY_BLOCKED = [
  { id: 'wblk-1', dayOfWeek: 2, time: '14:00', reason: '정기 개인 레슨' },
  { id: 'wblk-2', dayOfWeek: 2, time: '15:00', reason: '정기 개인 레슨' },
  { id: 'wblk-3', dayOfWeek: 4, time: '17:00', reason: '정기 기타 레슨' }
];

function getRelativeDateStr(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Customer booking page: 30-minute intervals from 10:00 to 19:00
const DEFAULT_TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00'
];

// 30-minute intervals for Weekly Timetable (10:00 ~ 20:00)
const WEEKLY_TIMETABLE_HOURS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00'
];

// Weekday columns starting from Monday to Sunday
const WEEKLY_TIMETABLE_DAYS = [
  { day: 1, name: '월요일', short: '월' },
  { day: 2, name: '화요일', short: '화' },
  { day: 3, name: '수요일', short: '수' },
  { day: 4, name: '목요일', short: '목' },
  { day: 5, name: '금요일', short: '금' },
  { day: 6, name: '토요일', short: '토', isSat: true },
  { day: 0, name: '일요일', short: '일', isSun: true }
];

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// App State
const state = {
  currentCalendarMonth: new Date(),
  selectedMainType: '레슨 상담',
  selectedSubType: '어쿠스틱 기타',
  selectedDate: null,
  selectedTime: null,
  contactMethod: '카카오톡',
  lastSubmitted: null,
  kakaoChannelId: '_xmxmxbG',
  adminCalendarMonth: new Date(),
  adminSelectedDate: null,
  isSubmitting: false
};

// DOM Elements
const el = {
  formView: document.getElementById('formView'),
  completeView: document.getElementById('completeView'),
  consultationForm: document.getElementById('consultationForm'),

  // Inquiry Types & Sub Panels
  inquiryTypeCards: document.querySelectorAll('.type-card'),
  lessonSubPanel: document.getElementById('lessonSubPanel'),
  workSubPanel: document.getElementById('workSubPanel'),
  lessonSubChips: document.querySelectorAll('#lessonSubPanel .sub-chip'),
  workSubChips: document.querySelectorAll('#workSubPanel .sub-chip'),
  
  // Calendar & Times
  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  currentMonthLabel: document.getElementById('currentMonthLabel'),
  calendarDaysGrid: document.getElementById('calendarDaysGrid'),
  selectedDateDisplay: document.getElementById('selectedDateDisplay'),
  timeSlotGrid: document.getElementById('timeSlotGrid'),
  datetimeError: document.getElementById('datetimeError'),

  // Customer Inputs
  userName: document.getElementById('userName'),
  nameError: document.getElementById('nameError'),
  userNotes: document.getElementById('userNotes'),
  contactChips: document.querySelectorAll('.method-chip'),
  userPhone: document.getElementById('userPhone'),
  phoneError: document.getElementById('phoneError'),

  // Review Card Elements
  reviewType: document.getElementById('reviewType'),
  reviewDate: document.getElementById('reviewDate'),
  reviewTime: document.getElementById('reviewTime'),
  reviewName: document.getElementById('reviewName'),
  reviewMethod: document.getElementById('reviewMethod'),
  reviewPhone: document.getElementById('reviewPhone'),
  reviewNotes: document.getElementById('reviewNotes'),

  // Complete View Elements
  ticketId: document.getElementById('ticketId'),
  ticketType: document.getElementById('ticketType'),
  ticketDateTime: document.getElementById('ticketDateTime'),
  ticketName: document.getElementById('ticketName'),
  ticketMethod: document.getElementById('ticketMethod'),
  ticketNotes: document.getElementById('ticketNotes'),
  kakaoChannelBtn: document.getElementById('kakaoChannelBtn'),
  downloadIcsBtn: document.getElementById('downloadIcsBtn'),
  resetBookingBtn: document.getElementById('resetBookingBtn'),

  // Admin Modal & Tabs
  openAdminBtn: document.getElementById('openAdminBtn'),
  adminPendingCount: document.getElementById('adminPendingCount'),
  adminModal: document.getElementById('adminModal'),
  closeAdminBtn: document.getElementById('closeAdminBtn'),
  tabBookings: document.getElementById('tabBookings'),
  tabCalendar: document.getElementById('tabCalendar'),
  tabSchedules: document.getElementById('tabSchedules'),
  tabCountSpan: document.getElementById('tabCountSpan'),
  adminBookingsPanel: document.getElementById('adminBookingsPanel'),
  adminCalendarPanel: document.getElementById('adminCalendarPanel'),
  adminSchedulesPanel: document.getElementById('adminSchedulesPanel'),
  adminTableBody: document.getElementById('adminTableBody'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),

  // Admin Calendar Elements
  adminCalPrev: document.getElementById('adminCalPrev'),
  adminCalNext: document.getElementById('adminCalNext'),
  adminCalMonthLabel: document.getElementById('adminCalMonthLabel'),
  adminCalGrid: document.getElementById('adminCalGrid'),
  adminCalDetail: document.getElementById('adminCalDetail'),

  // Schedule Mode & Forms
  modeWeeklyBtn: document.getElementById('modeWeeklyBtn'),
  modeSingleBtn: document.getElementById('modeSingleBtn'),
  weeklyBlockForm: document.getElementById('weeklyBlockForm'),
  singleBlockForm: document.getElementById('singleBlockForm'),

  // Weekly Recurring Blocking Inputs (Multi-select)
  weeklyReasonInput: document.getElementById('weeklyReasonInput'),
  addWeeklyBlockBtn: document.getElementById('addWeeklyBlockBtn'),
  weeklyBlockListBody: document.getElementById('weeklyBlockListBody'),
  weeklyBlockCountSpan: document.getElementById('weeklyBlockCountSpan'),
  singleBlockCountSpan: document.getElementById('singleBlockCountSpan'),
  selectedDaysCount: document.getElementById('selectedDaysCount'),
  selectedTimesCount: document.getElementById('selectedTimesCount'),
  totalCombinationsCount: document.getElementById('totalCombinationsCount'),
  btnDaysAll: document.getElementById('btnDaysAll'),
  btnDaysWeekday: document.getElementById('btnDaysWeekday'),
  btnDaysWeekend: document.getElementById('btnDaysWeekend'),
  btnDaysClear: document.getElementById('btnDaysClear'),
  btnTimesAll: document.getElementById('btnTimesAll'),
  btnTimesMorning: document.getElementById('btnTimesMorning'),
  btnTimesEvening: document.getElementById('btnTimesEvening'),
  btnTimesClear: document.getElementById('btnTimesClear'),

  // Timetable View Elements
  weeklyTimetableView: document.getElementById('weeklyTimetableView'),
  weeklyListView: document.getElementById('weeklyListView'),
  btnViewTimetable: document.getElementById('btnViewTimetable'),
  btnViewList: document.getElementById('btnViewList'),

  // Admin Single Schedule Blocking Inputs
  blockDateInput: document.getElementById('blockDateInput'),
  blockTimeSelect: document.getElementById('blockTimeSelect'),
  blockReasonInput: document.getElementById('blockReasonInput'),
  addBlockBtn: document.getElementById('addBlockBtn'),
  blockedListBody: document.getElementById('blockedListBody')
};

// ----------------------------------------------------
// Supabase: 전체 데이터 로드 (앱 시작 시)
// ----------------------------------------------------
async function loadAllData() {
  try {
    const [bRes, blkRes, wblkRes] = await Promise.all([
      db.from('bookings').select('*').order('createdAt', { ascending: false }),
      db.from('blocked_schedules').select('*'),
      db.from('weekly_blocks').select('*')
    ]);
    if (bRes.data)    _cache.bookings         = bRes.data;
    if (blkRes.data)  _cache.blockedSchedules = blkRes.data;
    if (wblkRes.data) {
      _cache.weeklyBlocks = wblkRes.data;
      // 기본 고정 레슨이 하나도 없으면 DEFAULT 삽입
      if (_cache.weeklyBlocks.length === 0) {
        const { data } = await db.from('weekly_blocks').insert(DEFAULT_WEEKLY_BLOCKED).select();
        if (data) _cache.weeklyBlocks = data;
      }
    }
  } catch (err) {
    console.error('Supabase 데이터 로드 오류:', err);
  }
}

// Supabase Realtime 실시간 구독 (모든 기기 동기화)
function subscribeRealtime() {
  db.channel('public:bookings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async () => {
      const { data } = await db.from('bookings').select('*').order('createdAt', { ascending: false });
      if (data) _cache.bookings = data;
      updateAdminCounters();
      renderCalendar();
      renderTimeSlots();
      if (el.adminModal && el.adminModal.style.display !== 'none') {
        renderAdminBookingsTable();
        renderAdminCalendar();
      }
    }).subscribe();

  db.channel('public:blocked_schedules')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_schedules' }, async () => {
      const { data } = await db.from('blocked_schedules').select('*');
      if (data) _cache.blockedSchedules = data;
      renderCalendar();
      renderTimeSlots();
      if (el.adminModal && el.adminModal.style.display !== 'none') {
        renderBlockedListTable();
        renderAdminCalendar();
      }
    }).subscribe();

  db.channel('public:weekly_blocks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_blocks' }, async () => {
      const { data } = await db.from('weekly_blocks').select('*');
      if (data) _cache.weeklyBlocks = data;
      renderCalendar();
      renderTimeSlots();
      if (el.adminModal && el.adminModal.style.display !== 'none') {
        renderBlockedListTable();
        renderAdminCalendar();
      }
    }).subscribe();
}

// 캐시 기반 동기 getter (기존 호출 구조 유지)
function getBookings()                { return _cache.bookings; }
function getBlockedSchedules()        { return _cache.blockedSchedules; }
function getWeeklyBlockedSchedules()  { return _cache.weeklyBlocks; }

// (하위 호환용 더미 — 실제 저장은 각 액션 함수에서 Supabase 직접 호출)
function saveBookings(list)                { _cache.bookings         = list; updateAdminCounters(); }
function saveBlockedSchedules(list)        { _cache.blockedSchedules = list; }
function saveWeeklyBlockedSchedules(list)  { _cache.weeklyBlocks     = list; }

function updateAdminCounters() {
  const bookings = getBookings();
  const pending = bookings.filter(b => b.status === 'pending').length;
  el.adminPendingCount.textContent = pending;
  el.tabCountSpan.textContent = bookings.length;
}

// ----------------------------------------------------
// Date & Time Utility Functions
// ----------------------------------------------------
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

  // 1. Weekly recurring all-day block check
  const weeklyList = getWeeklyBlockedSchedules();
  if (weeklyList.some(item => item.dayOfWeek === dayOfWeek && item.time === 'ALL')) {
    return true;
  }

  // 2. Specific single-day all-day block check
  const blockedList = getBlockedSchedules();
  return blockedList.some(item => item.date === dateStr && item.time === 'ALL');
}

function isTimeBlocked(dateStr, timeStr) {
  if (!dateStr || !timeStr) return true;
  if (isDateBlocked(dateStr)) return true;

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  // 1. Weekly recurring block check (matches day of week + time slot or ALL)
  const weeklyList = getWeeklyBlockedSchedules();
  if (weeklyList.some(item => item.dayOfWeek === dayOfWeek && (item.time === timeStr || item.time === 'ALL'))) {
    return true;
  }

  // 2. Specific single-day manual block check
  const blockedList = getBlockedSchedules();
  const hasManualBlock = blockedList.some(item => item.date === dateStr && (item.time === timeStr || item.time === 'ALL'));
  if (hasManualBlock) return true;

  // 3. Existing customer booking check
  const bookings = getBookings();
  return bookings.some(b => b.date === dateStr && b.time === timeStr && b.status !== 'declined');
}

// ----------------------------------------------------
// Calendar Logic
// ----------------------------------------------------
function renderCalendar() {
  const year = state.currentCalendarMonth.getFullYear();
  const month = state.currentCalendarMonth.getMonth();

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

    const isPast = cellDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0);
    const isFullDayOff = isDateBlocked(dateStr);

    if (isPast || isFullDayOff) {
      dayBtn.classList.add('disabled');
      dayBtn.disabled = true;
      if (isFullDayOff) {
        dayBtn.title = '휴무/예약 불가일입니다.';
      }
    } else {
      if (dateStr === todayStr) {
        dayBtn.classList.add('today');
      }
      if (dateStr === state.selectedDate) {
        dayBtn.classList.add('selected');
      }

      dayBtn.addEventListener('click', () => {
        selectDate(dateStr);
      });
    }

    el.calendarDaysGrid.appendChild(dayBtn);
  }
}

function selectDate(dateStr) {
  state.selectedDate = dateStr;
  state.selectedTime = null;

  renderCalendar();
  el.selectedDateDisplay.textContent = formatKoreanDate(dateStr);
  renderTimeSlots();
  updateReviewCard();
}

// ----------------------------------------------------
// Time Slots Logic
// ----------------------------------------------------
function renderTimeSlots() {
  el.timeSlotGrid.innerHTML = '';

  if (!state.selectedDate) {
    el.timeSlotGrid.innerHTML = `
      <div class="no-slots-msg">
        📅 달력에서 원하시는 날짜를<br>먼저 선택해 주세요.
      </div>
    `;
    return;
  }

  DEFAULT_TIME_SLOTS.forEach(time => {
    const slotBtn = document.createElement('button');
    slotBtn.type = 'button';
    slotBtn.className = 'slot-btn';
    slotBtn.textContent = time;

    const blocked = isTimeBlocked(state.selectedDate, time);

    if (blocked) {
      slotBtn.classList.add('booked');
      slotBtn.disabled = true;
      slotBtn.title = '레슨/스튜디오 일정 또는 이미 상담이 잡힌 시간입니다.';
    } else {
      if (state.selectedTime === time) {
        slotBtn.classList.add('selected');
      }

      slotBtn.addEventListener('click', () => {
        selectTime(time);
      });
    }

    el.timeSlotGrid.appendChild(slotBtn);
  });
}

function selectTime(time) {
  state.selectedTime = time;
  el.datetimeError.style.display = 'none';

  const allBtns = el.timeSlotGrid.querySelectorAll('.slot-btn');
  allBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.textContent === time);
  });

  updateReviewCard();
}

// ----------------------------------------------------
// Realtime Review Card Updater
// ----------------------------------------------------
function getFullInquiryTypeLabel() {
  if (state.selectedSubType) {
    return `${state.selectedMainType} · ${state.selectedSubType}`;
  }
  return state.selectedMainType;
}

function updateReviewCard() {
  el.reviewType.textContent = getFullInquiryTypeLabel();
  el.reviewDate.textContent = state.selectedDate ? formatKoreanDate(state.selectedDate) : '날짜를 선택해 주세요';
  el.reviewTime.textContent = state.selectedTime ? state.selectedTime : '시간을 선택해 주세요';
  
  const nameVal = el.userName.value.trim();
  el.reviewName.textContent = nameVal ? `${nameVal} 님` : '-';

  el.reviewMethod.textContent = state.contactMethod;

  const phoneVal = el.userPhone.value.trim();
  el.reviewPhone.textContent = phoneVal || '-';

  const notesVal = el.userNotes.value.trim();
  el.reviewNotes.textContent = notesVal || '(작성 내용 없음)';
}

function formatPhoneNumber(val) {
  const clean = val.replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
}

// ----------------------------------------------------
// Form Submission Logic (Supabase INSERT)
// ----------------------------------------------------
async function handleSubmit(e) {
  e.preventDefault();
  if (state.isSubmitting) return;

  let hasError = false;

  if (!state.selectedDate || !state.selectedTime) {
    el.datetimeError.style.display = 'block';
    hasError = true;
  } else {
    el.datetimeError.style.display = 'none';
  }

  const name = el.userName.value.trim();
  if (!name) {
    el.nameError.style.display = 'block';
    if (!hasError) el.userName.focus();
    hasError = true;
  } else {
    el.nameError.style.display = 'none';
  }

  const phone = el.userPhone.value.trim();
  const phoneRegex = /^01[016789]-?[0-9]{3,4}-?[0-9]{4}$/;
  if (!phone || !phoneRegex.test(phone)) {
    el.phoneError.style.display = 'block';
    if (!hasError) el.userPhone.focus();
    hasError = true;
  } else {
    el.phoneError.style.display = 'none';
  }

  if (hasError) return;

  // 이중 제출 방지
  state.isSubmitting = true;
  const submitBtn = document.getElementById('submitBookingBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '신청 중...'; }

  const now = new Date();
  const bookingId = 'IMAP-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + Math.floor(1000 + Math.random() * 9000);
  const fullType = getFullInquiryTypeLabel();

  const newBooking = {
    id: bookingId,
    type: fullType,
    mainType: state.selectedMainType,
    subType: state.selectedSubType,
    date: state.selectedDate,
    time: state.selectedTime,
    name: name,
    contactMethod: state.contactMethod,
    phone: phone,
    notes: el.userNotes.value.trim(),
    createdAt: now.toISOString(),
    status: 'pending'
  };

  try {
    const { error } = await db.from('bookings').insert([newBooking]);
    if (error) throw error;
    _cache.bookings.unshift(newBooking);
    state.lastSubmitted = newBooking;
    updateAdminCounters();
    showCompleteView(newBooking);
  } catch (err) {
    console.error('예약 저장 오류:', err);
    alert('예약 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n오류: ' + (err.message || err));
  } finally {
    state.isSubmitting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '상담 예약 신청 완료하기'; }
  }
}

function showCompleteView(b) {
  el.ticketId.textContent = '#' + b.id;
  el.ticketType.textContent = b.type;
  el.ticketDateTime.textContent = `${formatKoreanDate(b.date)} ${b.time}`;
  el.ticketName.textContent = `${b.name} 님`;
  el.ticketMethod.textContent = `${b.contactMethod} (${b.phone.replace(/(\d{3})-\d{4}-(\d{4})/, '$1-****-$2')})`;
  el.ticketNotes.textContent = b.notes ? b.notes : '특이사항 없음';

  el.formView.style.display = 'none';
  el.completeView.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------------------
// Calendar Export (.ics)
// ----------------------------------------------------
function downloadIcsCalendar(booking) {
  if (!booking) return;

  const [y, m, d] = booking.date.split('-').map(Number);
  const [hour, minute] = booking.time.split(':').map(Number);

  const startDate = new Date(y, m - 1, d, hour, minute);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1000);

  const formatIcsTime = (dt) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IMAP Studio Reservation//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@imapstudio.kr`,
    `DTSTAMP:${formatIcsTime(new Date())}`,
    `DTSTART:${formatIcsTime(startDate)}`,
    `DTEND:${formatIcsTime(endDate)}`,
    `SUMMARY:[상담신청] IMAP Studio - ${booking.type}`,
    `DESCRIPTION:신청자: ${booking.name}\\n연락처: ${booking.phone}\\n선호연락: ${booking.contactMethod}`,
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `IMAP스튜디오_상담신청_${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// Admin Dashboard
// ----------------------------------------------------
function renderAdminBookingsTable() {
  const bookings = getBookings();
  el.adminTableBody.innerHTML = '';

  if (bookings.length === 0) {
    el.adminTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #8C7E75; padding: 24px;">
          접수된 상담 신청 내역이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  [...bookings].reverse().forEach(item => {
    const tr = document.createElement('tr');
    
    let statusBadge = `<span class="badge-pending">신청 대기</span>`;
    if (item.status === 'confirmed') statusBadge = `<span class="badge-confirmed">상담 확정</span>`;
    if (item.status === 'declined') statusBadge = `<span class="badge-declined">취소/거절</span>`;

    const createdAtFormatted = item.createdAt ? item.createdAt.substring(5, 16).replace('T', ' ') : '-';

    tr.innerHTML = `
      <td>${createdAtFormatted}</td>
      <td><strong>${item.type}</strong></td>
      <td>${item.date} ${item.time}</td>
      <td>${item.name} (${item.contactMethod}: ${item.phone})</td>
      <td style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.notes || ''}">
        ${item.notes || '-'}
      </td>
      <td>${statusBadge}</td>
      <td>
        <div style="display: flex; gap: 4px;">
          ${item.status !== 'confirmed' ? `<button type="button" class="btn-sm btn-approve" data-act="confirm" data-id="${item.id}">확정</button>` : ''}
          ${item.status !== 'declined' ? `<button type="button" class="btn-sm btn-decline" data-act="decline" data-id="${item.id}">거절</button>` : ''}
          <button type="button" class="btn-sm btn-outline" data-act="delete" data-id="${item.id}">삭제</button>
        </div>
      </td>
    `;
    el.adminTableBody.appendChild(tr);
  });

  el.adminTableBody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const act = e.currentTarget.getAttribute('data-act');
      const id = e.currentTarget.getAttribute('data-id');
      handleAdminAction(act, id);
    });
  });
}

async function handleAdminAction(act, id) {
  const bookings = getBookings();
  const target   = bookings.find(b => b.id === id);
  if (!target) return;

  try {
    if (act === 'confirm') {
      const { error } = await db.from('bookings').update({ status: 'confirmed' }).eq('id', id);
      if (error) throw error;
      target.status = 'confirmed';
      alert(`[${target.name} 님]의 ${target.date} ${target.time} 일정이 '상담 확정'되었습니다.\n해당 시간은 달력에서 자동으로 마감됩니다.`);
    } else if (act === 'decline') {
      if (!confirm('신청을 거절하시겠습니까?')) return;
      const { error } = await db.from('bookings').update({ status: 'declined' }).eq('id', id);
      if (error) throw error;
      target.status = 'declined';
    } else if (act === 'delete') {
      if (!confirm('이 예약 내역을 영구 삭제하시겠습니까?')) return;
      const { error } = await db.from('bookings').delete().eq('id', id);
      if (error) throw error;
      _cache.bookings = _cache.bookings.filter(b => b.id !== id);
    }
  } catch (err) {
    alert('오류가 발생했습니다: ' + (err.message || err));
    return;
  }

  updateAdminCounters();
  renderAdminBookingsTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
}

function renderBlockedListTable() {
  // 1. Render Weekly Recurring Blocks
  renderWeeklyBlockedListTable();

  // 2. Render Single Date Blocks
  const list = getBlockedSchedules();
  el.blockedListBody.innerHTML = '';
  if (el.singleBlockCountSpan) {
    el.singleBlockCountSpan.textContent = list.length;
  }

  if (list.length === 0) {
    el.blockedListBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #8C7E75; padding: 18px;">
          등록된 1회성 날짜 차단 일정이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.date}</strong></td>
      <td>${item.time === 'ALL' ? '<span style="color:#B45348; font-weight:700;">하루 종일 (휴무)</span>' : item.time}</td>
      <td>${item.reason || '-'}</td>
      <td><span class="badge-confirmed">차단중</span></td>
      <td>
        <button type="button" class="btn-sm btn-decline remove-block-btn" data-id="${item.id}">해제</button>
      </td>
    `;
    el.blockedListBody.appendChild(tr);
  });

  el.blockedListBody.querySelectorAll('.remove-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      removeBlockedSchedule(id);
    });
  });
}

// Determine card style category based on reason text
function getLessonCategoryStyle(reason = '') {
  const text = (reason || '').toLowerCase();
  if (text.includes('예약') || text.includes('상담') || text.includes('미팅')) {
    return {
      className: 'tt-card-booking',
      label: '예약 레슨'
    };
  }
  if (text.includes('개인') || text.includes('1:1') || text.includes('프라이빗')) {
    return {
      className: 'tt-card-private',
      label: '개인 레슨'
    };
  }
  if (text.includes('휴무') || text.includes('차단') || text.includes('외출') || text.includes('개인일정')) {
    return {
      className: 'tt-card-blocked',
      label: '일정 차단'
    };
  }
  return {
    className: 'tt-card-regular',
    label: '정기 고정 레슨'
  };
}

// 1. Google Calendar Style Weekly Timetable Grid
function renderWeeklyTimetableGrid(list) {
  if (!el.weeklyTimetableView) return;

  // Build the timetable grid table
  let html = `
    <table class="timetable-grid-table">
      <thead>
        <tr>
          <th>시간</th>
          ${WEEKLY_TIMETABLE_DAYS.map(d => {
            const cls = d.isSat ? 'day-sat' : d.isSun ? 'day-sun' : '';
            const dayHasItems = list.some(item => item.dayOfWeek === d.day);
            return `<th class="${cls}">
              <div class="timetable-day-header">
                <span>${d.name}</span>
                ${dayHasItems ? `<button type="button" class="tt-day-clear-btn" data-day="${d.day}" title="${d.name} 등록 일정 전체 일괄 삭제">전체 삭제</button>` : ''}
              </div>
            </th>`;
          }).join('')}
        </tr>
      </thead>
      <tbody>
        <!-- All-Day (하루 종일) Row -->
        <tr class="timetable-allday-row">
          <th>종일</th>
          ${WEEKLY_TIMETABLE_DAYS.map(d => {
            const allDayItems = list.filter(item => item.dayOfWeek === d.day && item.time === 'ALL');
            if (allDayItems.length === 0) {
              return '<td></td>';
            }
            return `
              <td>
                ${allDayItems.map(item => `
                  <div class="allday-badge-box" title="${item.reason || '정기 휴무'}">
                    <span>🚫 ${item.reason || '정기 휴무'}</span>
                    <button type="button" class="allday-del-btn remove-weekly-block-btn" data-id="${item.id}" title="해제">×</button>
                  </div>
                `).join('')}
              </td>
            `;
          }).join('')}
        </tr>
  `;

  // Time Slots (30 min increments)
  WEEKLY_TIMETABLE_HOURS.forEach(timeStr => {
    const isHour = timeStr.endsWith(':00');
    const rowClass = isHour ? 'timetable-row-hour' : 'timetable-row-half';

    html += `
      <tr class="${rowClass}">
        <td class="timetable-time-cell">${timeStr}</td>
        ${WEEKLY_TIMETABLE_DAYS.map(d => {
          // Find matching recurring schedules for this day and time
          const matches = list.filter(item => item.dayOfWeek === d.day && item.time === timeStr);
          if (matches.length === 0) {
            return `<td></td>`;
          }
          return `
            <td>
              ${matches.map(item => {
                const cat = getLessonCategoryStyle(item.reason);
                return `
                  <div class="tt-lesson-card ${cat.className}">
                    <div class="tt-card-header">
                      <span class="tt-card-time">${item.time}</span>
                      <button type="button" class="tt-card-del-btn remove-weekly-block-btn" data-id="${item.id}" title="해제">×</button>
                    </div>
                    <div class="tt-card-reason" title="${item.reason || '정기 고정 레슨'}">${item.reason || '정기 고정 레슨'}</div>
                  </div>
                `;
              }).join('')}
            </td>
          `;
        }).join('')}
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  el.weeklyTimetableView.innerHTML = html;

  // Bind delete handlers inside timetable
  el.weeklyTimetableView.querySelectorAll('.remove-weekly-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-id');
      removeWeeklyBlockedSchedule(id);
    });
  });

  // Bind day-bulk-clear handlers
  el.weeklyTimetableView.querySelectorAll('.tt-day-clear-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const day = Number(e.currentTarget.getAttribute('data-day'));
      removeAllWeeklyBlocksByDay(day);
    });
  });
}

function renderWeeklyBlockedListTable() {
  const list = getWeeklyBlockedSchedules();
  if (el.weeklyBlockCountSpan) {
    el.weeklyBlockCountSpan.textContent = list.length;
  }

  // 1. Render Google Calendar style Timetable
  renderWeeklyTimetableGrid(list);

  // 2. Render Traditional List View
  if (!el.weeklyBlockListBody) return;
  el.weeklyBlockListBody.innerHTML = '';

  if (list.length === 0) {
    el.weeklyBlockListBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #8C7E75; padding: 18px;">
          등록된 매주 반복 고정 레슨/일정이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  // Sort by Monday -> Sunday then time
  const sorted = [...list].sort((a, b) => {
    const da = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const db = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    if (da !== db) return da - db;
    return a.time.localeCompare(b.time);
  });

  sorted.forEach(item => {
    const dayName = KOREAN_WEEKDAYS[item.dayOfWeek];
    const cat = getLessonCategoryStyle(item.reason);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="color:var(--primary);">매주 ${dayName}요일</strong></td>
      <td>${item.time === 'ALL' ? '<span style="color:#B45348; font-weight:700;">하루 종일 (정기 휴무)</span>' : `<strong>${item.time}</strong>`}</td>
      <td>
        <span class="timetable-legend-badge ${cat.className === 'tt-card-booking' ? 'legend-booking' : cat.className === 'tt-card-private' ? 'legend-private' : 'legend-fixed'}" style="margin-right:4px;">${cat.label}</span>
        ${item.reason || '정기 레슨'}
      </td>
      <td><span class="badge-confirmed">매주 반복중</span></td>
      <td>
        <button type="button" class="btn-sm btn-decline remove-weekly-block-btn" data-id="${item.id}">해제</button>
      </td>
    `;
    el.weeklyBlockListBody.appendChild(tr);
  });

  el.weeklyBlockListBody.querySelectorAll('.remove-weekly-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      removeWeeklyBlockedSchedule(id);
    });
  });
}

function updateWeeklySelectionSummary() {
  const checkedDays = document.querySelectorAll('input[name="weeklyDay"]:checked');
  const checkedTimes = document.querySelectorAll('input[name="weeklyTime"]:checked');

  const daysCount = checkedDays.length;
  const timesCount = checkedTimes.length;
  const total = daysCount * timesCount;

  if (el.selectedDaysCount) el.selectedDaysCount.textContent = daysCount;
  if (el.selectedTimesCount) el.selectedTimesCount.textContent = timesCount;
  if (el.totalCombinationsCount) el.totalCombinationsCount.textContent = total;

  if (el.addWeeklyBlockBtn) {
    if (total > 0) {
      el.addWeeklyBlockBtn.textContent = `+ 선택한 일정 ${total}건 일괄 차단 등록`;
    } else {
      el.addWeeklyBlockBtn.textContent = '+ 선택한 일정 일괄 차단 등록';
    }
  }
}

async function addWeeklyBlockedSchedule() {
  const checkedDayEls  = Array.from(document.querySelectorAll('input[name="weeklyDay"]:checked'));
  const checkedTimeEls = Array.from(document.querySelectorAll('input[name="weeklyTime"]:checked'));
  const reasonVal      = (el.weeklyReasonInput && el.weeklyReasonInput.value.trim()) || '정기 고정 레슨';

  if (checkedDayEls.length === 0) {
    alert('차단할 반복 요일을 1개 이상 선택해 주세요.');
    return;
  }
  if (checkedTimeEls.length === 0) {
    alert('차단할 고정 시간을 1개 이상 선택해 주세요.');
    return;
  }

  const selectedDays  = checkedDayEls.map(input => Number(input.value));
  const selectedTimes = checkedTimeEls.map(input => input.value);
  const list          = getWeeklyBlockedSchedules();
  const toInsert      = [];
  let duplicateCount  = 0;
  const summaryByDay  = {};

  selectedDays.forEach(day => {
    summaryByDay[day] = [];
    selectedTimes.forEach(time => {
      const exists = list.some(item => item.dayOfWeek === day && item.time === time);
      if (exists) {
        duplicateCount++;
      } else {
        const id = 'wblk-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
        toInsert.push({ id, dayOfWeek: day, time, reason: reasonVal });
        summaryByDay[day].push(time === 'ALL' ? '하루 종일' : time);
      }
    });
  });

  if (toInsert.length === 0) {
    alert(`선택하신 모든 일정 조합(${duplicateCount}건)이 이미 등록되어 있습니다.`);
    return;
  }

  try {
    const { error } = await db.from('weekly_blocks').insert(toInsert);
    if (error) throw error;
    _cache.weeklyBlocks.push(...toInsert);
  } catch (err) {
    alert('저장 오류: ' + (err.message || err));
    return;
  }

  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();

  document.querySelectorAll('input[name="weeklyDay"]').forEach(c => c.checked = false);
  document.querySelectorAll('input[name="weeklyTime"]').forEach(c => c.checked = false);
  if (el.weeklyReasonInput) el.weeklyReasonInput.value = '';
  updateWeeklySelectionSummary();

  let msg = `[매주 고정 레슨/일정 차단 등록 완료]\n총 ${toInsert.length}건의 일정이 등록되었습니다.\n\n`;
  selectedDays.forEach(day => {
    if (summaryByDay[day] && summaryByDay[day].length > 0)
      msg += `• ${KOREAN_WEEKDAYS[day]}요일: ${summaryByDay[day].join(', ')}\n`;
  });
  if (duplicateCount > 0) msg += `\n※ 이미 등록되어 있던 ${duplicateCount}건은 중복 방지로 제외되었습니다.`;
  msg += '\n\n매주 해당 시간에는 예약자가 신청할 수 없도록 자동 차단됩니다.';
  alert(msg);
}

async function removeWeeklyBlockedSchedule(id) {
  const list   = getWeeklyBlockedSchedules();
  const target = list.find(item => item.id === id);
  if (!target) return;
  if (!confirm(`[매주 ${KOREAN_WEEKDAYS[target.dayOfWeek]}요일 ${target.time}] 정기 차단을 해제하시겠습니까?`)) return;

  try {
    const { error } = await db.from('weekly_blocks').delete().eq('id', id);
    if (error) throw error;
    _cache.weeklyBlocks = _cache.weeklyBlocks.filter(item => item.id !== id);
  } catch (err) {
    alert('오류: ' + (err.message || err));
    return;
  }
  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
}

async function removeAllWeeklyBlocksByDay(dayOfWeek) {
  const dayName = KOREAN_WEEKDAYS[dayOfWeek];
  const list = getWeeklyBlockedSchedules();
  const targets = list.filter(item => item.dayOfWeek === dayOfWeek);
  if (targets.length === 0) return;

  if (!confirm(`매주 [${dayName}요일]의 고정 레슨/일정 총 ${targets.length}건을 모두 일괄 삭제하시겠습니까?`)) return;

  try {
    const { error } = await db.from('weekly_blocks').delete().eq('dayOfWeek', dayOfWeek);
    if (error) throw error;
    _cache.weeklyBlocks = _cache.weeklyBlocks.filter(item => item.dayOfWeek !== dayOfWeek);
  } catch (err) {
    alert('일괄 삭제 오류: ' + (err.message || err));
    return;
  }

  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
}

async function addBlockedSchedule() {
  const dateVal   = el.blockDateInput.value;
  const timeVal   = el.blockTimeSelect.value;
  const reasonVal = el.blockReasonInput.value.trim() || '스튜디오 일정/임시 휴무';

  if (!dateVal) {
    alert('차단할 날짜를 선택해 주세요.');
    return;
  }

  const newBlock = { id: 'blk-' + Date.now(), date: dateVal, time: timeVal, reason: reasonVal };

  try {
    const { error } = await db.from('blocked_schedules').insert([newBlock]);
    if (error) throw error;
    _cache.blockedSchedules.push(newBlock);
  } catch (err) {
    alert('저장 오류: ' + (err.message || err));
    return;
  }

  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
  el.blockReasonInput.value = '';
  alert(`${dateVal} [${timeVal === 'ALL' ? '하루 종일' : timeVal}] 일정이 예약 불가로 차단되었습니다.`);
}

async function removeBlockedSchedule(id) {
  try {
    const { error } = await db.from('blocked_schedules').delete().eq('id', id);
    if (error) throw error;
    _cache.blockedSchedules = _cache.blockedSchedules.filter(item => item.id !== id);
  } catch (err) {
    alert('오류: ' + (err.message || err));
    return;
  }
  renderBlockedListTable();
  renderCalendar();
  renderTimeSlots();
  renderAdminCalendar();
}

function exportCsv() {
  const bookings = getBookings();
  if (bookings.length === 0) {
    alert('다운로드할 내역이 없습니다.');
    return;
  }

  const BOM = '\uFEFF';
  const headers = ['신청번호', '문의유형', '희망일자', '희망시간', '이름', '선호연락', '전화번호', '문의내용', '상태', '신청일시'];
  const rows = bookings.map(b => [
    `"${b.id}"`,
    `"${b.type}"`,
    `"${b.date}"`,
    `"${b.time}"`,
    `"${b.name}"`,
    `"${b.contactMethod}"`,
    `"${b.phone}"`,
    `"${(b.notes || '').replace(/"/g, '""')}"`,
    `"${b.status}"`,
    `"${b.createdAt}"`
  ]);

  const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `IMAP스튜디오_상담신청목록_${formatDate(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// Admin Calendar View Functions
// ----------------------------------------------------
function renderAdminCalendar() {
  if (!el.adminCalGrid) return;

  const current = state.adminCalendarMonth;
  const year = current.getFullYear();
  const month = current.getMonth();

  if (el.adminCalMonthLabel) {
    el.adminCalMonthLabel.textContent = `${year}년 ${month + 1}월`;
  }

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const allBookings = getBookings();
  const allBlocked = getBlockedSchedules();
  const weeklyList = getWeeklyBlockedSchedules();
  const todayStr = formatDate(new Date());

  if (!state.adminSelectedDate) {
    state.adminSelectedDate = todayStr;
  }

  el.adminCalGrid.innerHTML = '';

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'admin-cal-cell empty';
    el.adminCalGrid.appendChild(emptyCell);
  }

  // Days in month
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay();

    const cell = document.createElement('div');
    cell.className = 'admin-cal-cell';
    if (dayOfWeek === 0) cell.classList.add('sun');
    if (dayOfWeek === 6) cell.classList.add('sat');
    if (dateStr === todayStr) cell.classList.add('today');
    if (dateStr === state.adminSelectedDate) cell.classList.add('selected');

    // Count bookings & blocks on this day
    const dayBookings = allBookings.filter(b => b.date === dateStr);
    const dayBlocked = allBlocked.filter(b => b.date === dateStr);
    const dayWeekly = weeklyList.filter(item => item.dayOfWeek === dayOfWeek);
    const totalCount = dayBookings.length;

    let badgeHtml = '';
    if (totalCount > 0) {
      badgeHtml = `<span class="admin-cal-badge">${totalCount}건</span>`;
    } else if (dayBlocked.some(b => b.time === 'ALL') || dayWeekly.some(b => b.time === 'ALL')) {
      badgeHtml = `<span class="admin-cal-badge" style="background:#8C7E75;">휴무</span>`;
    } else if (dayWeekly.length > 0) {
      badgeHtml = `<span class="admin-cal-badge" style="background:#4A7C72;">${dayWeekly.length}레슨</span>`;
    } else if (dayBlocked.length > 0) {
      badgeHtml = `<span class="admin-cal-badge" style="background:#5C6B64;">${dayBlocked.length}차단</span>`;
    }

    cell.innerHTML = `
      <span>${day}</span>
      ${badgeHtml}
    `;

    cell.addEventListener('click', () => {
      state.adminSelectedDate = dateStr;
      renderAdminCalendar();
    });

    el.adminCalGrid.appendChild(cell);
  }

  renderAdminDayDetail(state.adminSelectedDate);
}

function renderAdminDayDetail(dateStr) {
  if (!el.adminCalDetail) return;
  if (!dateStr) {
    el.adminCalDetail.innerHTML = '<div class="admin-cal-detail-empty">날짜를 선택하시면 해당 일자의 예약 및 일정 상세가 표시됩니다.</div>';
    return;
  }

  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const dayName = KOREAN_WEEKDAYS[dayOfWeek];
  const formattedTitle = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayName})`;

  const allBookings = getBookings();
  const allBlocked = getBlockedSchedules();
  const weeklyList = getWeeklyBlockedSchedules();

  const dayBookings = allBookings.filter(b => b.date === dateStr);
  const dayBlocked = allBlocked.filter(b => b.date === dateStr);
  const dayWeekly = weeklyList.filter(item => item.dayOfWeek === dayOfWeek);

  let html = `<div class="admin-cal-detail-title">📅 ${formattedTitle} 일정 상세 (신청 ${dayBookings.length}건 / 매주레슨 ${dayWeekly.length}건 / 차단 ${dayBlocked.length}건)</div>`;

  if (dayBookings.length === 0 && dayBlocked.length === 0 && dayWeekly.length === 0) {
    html += '<div class="admin-cal-detail-empty">이 날짜에는 등록된 상담 신청이나 차단 일정이 없습니다.</div>';
    el.adminCalDetail.innerHTML = html;
    return;
  }

  // 1. Weekly recurring lessons for this weekday
  if (dayWeekly.length > 0) {
    dayWeekly.forEach(item => {
      html += `
        <div class="admin-detail-card" style="border-left: 4px solid #4A7C72; background: #F3F8F6;">
          <div class="admin-detail-info">
            <div class="admin-detail-time" style="color: #2D524A;">
              🔁 ${item.time === 'ALL' ? '하루 종일 (정기 휴무)' : item.time + ' [매주 고정 레슨]'}
            </div>
            <div class="admin-detail-name">레슨/사유: <strong>${item.reason || '정기 레슨'}</strong> (매주 ${dayName}요일 반복)</div>
          </div>
          <div class="admin-detail-actions">
            <span class="badge-confirmed" style="background:#E1EFEA; color:#2D524A;">매주 반복</span>
          </div>
        </div>
      `;
    });
  }

  // 2. Single-day blocked schedules
  if (dayBlocked.length > 0) {
    dayBlocked.forEach(item => {
      html += `
        <div class="admin-detail-card" style="border-left: 4px solid #8C7E75; background: #FAF7F4;">
          <div class="admin-detail-info">
            <div class="admin-detail-time" style="color: #6C5E55;">
              🚫 ${item.time === 'ALL' ? '하루 종일 (스튜디오 휴무)' : item.time + ' (예약 차단)'}
            </div>
            <div class="admin-detail-name">사유: ${item.reason || '일정 차단'} (1회성 차단)</div>
          </div>
          <div class="admin-detail-actions">
            <button type="button" class="btn-sm btn-decline remove-cal-block-btn" data-id="${item.id}">해제</button>
          </div>
        </div>
      `;
    });
  }

  // 3. Customer Bookings list
  if (dayBookings.length > 0) {
    dayBookings.forEach(item => {
      let statusBadge = `<span class="badge-pending">대기</span>`;
      if (item.status === 'confirmed') statusBadge = `<span class="badge-confirmed">확정</span>`;
      if (item.status === 'declined') statusBadge = `<span class="badge-declined">취소</span>`;

      html += `
        <div class="admin-detail-card">
          <div class="admin-detail-info">
            <div class="admin-detail-time">
              ⏰ ${item.time} ${statusBadge}
            </div>
            <div class="admin-detail-name">
              <strong>${item.name}</strong> 님 (${item.contactMethod}: ${item.phone})
            </div>
            <div class="admin-detail-type">
              📌 ${item.type} ${item.notes ? `| 메모: ${item.notes}` : ''}
            </div>
          </div>
          <div class="admin-detail-actions">
            ${item.status !== 'confirmed' ? `<button type="button" class="btn-sm btn-approve" data-act="confirm" data-id="${item.id}">확정</button>` : ''}
            ${item.status !== 'declined' ? `<button type="button" class="btn-sm btn-decline" data-act="decline" data-id="${item.id}">거절</button>` : ''}
            <button type="button" class="btn-sm btn-outline" data-act="delete" data-id="${item.id}">삭제</button>
          </div>
        </div>
      `;
    });
  }

  el.adminCalDetail.innerHTML = html;

  // Add event listeners for booking action buttons in detail view
  el.adminCalDetail.querySelectorAll('.admin-detail-actions button[data-act]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const act = e.currentTarget.getAttribute('data-act');
      const id = e.currentTarget.getAttribute('data-id');
      handleAdminAction(act, id);
    });
  });

  // Add event listeners for unblocking in detail view
  el.adminCalDetail.querySelectorAll('.remove-cal-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      removeBlockedSchedule(id);
    });
  });
}

// ----------------------------------------------------
// Event Listeners & Initialization
// ----------------------------------------------------
function initEventListeners() {
  // 1. Main Inquiry Type Selection (레슨 상담 / 작업 의뢰 상담)
  el.inquiryTypeCards.forEach(card => {
    card.addEventListener('click', () => {
      el.inquiryTypeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      radio.checked = true;
      state.selectedMainType = radio.value;

      if (state.selectedMainType === '레슨 상담') {
        el.lessonSubPanel.classList.add('active');
        el.workSubPanel.classList.remove('active');
        // Set default or current active chip
        const activeChip = el.lessonSubPanel.querySelector('.sub-chip.selected') || el.lessonSubChips[0];
        state.selectedSubType = activeChip ? activeChip.getAttribute('data-value') : '어쿠스틱 기타';
      } else {
        el.workSubPanel.classList.add('active');
        el.lessonSubPanel.classList.remove('active');
        const activeChip = el.workSubPanel.querySelector('.sub-chip.selected') || el.workSubChips[0];
        state.selectedSubType = activeChip ? activeChip.getAttribute('data-value') : '음원 녹음';
      }

      updateReviewCard();
    });
  });

  // Sub Chips Handlers
  el.lessonSubChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.lessonSubChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      state.selectedSubType = chip.getAttribute('data-value');
      updateReviewCard();
    });
  });

  el.workSubChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.workSubChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      state.selectedSubType = chip.getAttribute('data-value');
      updateReviewCard();
    });
  });

  // 2. Calendar Month Navigation
  el.prevMonthBtn.addEventListener('click', () => {
    state.currentCalendarMonth.setMonth(state.currentCalendarMonth.getMonth() - 1);
    renderCalendar();
  });
  el.nextMonthBtn.addEventListener('click', () => {
    state.currentCalendarMonth.setMonth(state.currentCalendarMonth.getMonth() + 1);
    renderCalendar();
  });

  // 3. User Inputs Live Review
  el.userName.addEventListener('input', () => {
    el.nameError.style.display = 'none';
    updateReviewCard();
  });

  el.userNotes.addEventListener('input', () => {
    updateReviewCard();
  });

  // 4. Contact Method Selector (Kakao / Phone)
  el.contactChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.contactChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const radio = chip.querySelector('input[type="radio"]');
      radio.checked = true;
      state.contactMethod = radio.value;
      updateReviewCard();
    });
  });

  // 5. Phone Input Formatting & Validation
  el.userPhone.addEventListener('input', (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
    el.phoneError.style.display = 'none';
    updateReviewCard();
  });

  // 6. Form Submission
  el.consultationForm.addEventListener('submit', handleSubmit);

  // 7. Complete View Actions
  el.kakaoChannelBtn.addEventListener('click', () => {
    const channelUrl = `http://pf.kakao.com/${state.kakaoChannelId}/chat`;
    if (confirm('카카오톡 채널 채팅방으로 이동하시겠습니까?')) {
      window.open(channelUrl, '_blank');
    }
  });

  el.downloadIcsBtn.addEventListener('click', () => {
    downloadIcsCalendar(state.lastSubmitted);
  });

  el.resetBookingBtn.addEventListener('click', () => {
    state.selectedDate = null;
    state.selectedTime = null;
    el.consultationForm.reset();
    
    // Reset Type
    el.inquiryTypeCards.forEach(c => c.classList.remove('selected'));
    el.inquiryTypeCards[0].classList.add('selected');
    state.selectedMainType = '레슨 상담';
    el.lessonSubPanel.classList.add('active');
    el.workSubPanel.classList.remove('active');
    el.lessonSubChips.forEach(c => c.classList.remove('selected'));
    el.lessonSubChips[0].classList.add('selected');
    state.selectedSubType = '어쿠스틱 기타';

    // Reset Method
    el.contactChips.forEach(c => c.classList.remove('selected'));
    el.contactChips[0].classList.add('selected');
    state.contactMethod = '카카오톡';

    el.completeView.style.display = 'none';
    el.formView.style.display = 'block';

    renderCalendar();
    renderTimeSlots();
    updateReviewCard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 8. Admin Modal Actions
  const pwModal    = document.getElementById('pwModal');
  const pwInput    = document.getElementById('pwInput');
  const pwError    = document.getElementById('pwError');
  const pwCancelBtn  = document.getElementById('pwCancelBtn');
  const pwConfirmBtn = document.getElementById('pwConfirmBtn');

  function openPwModal() {
    pwInput.value = '';
    pwError.style.display = 'none';
    pwModal.style.display = 'flex';
    setTimeout(() => pwInput.focus(), 100);
  }

  function closePwModal() {
    pwModal.style.display = 'none';
    pwInput.value = '';
    pwError.style.display = 'none';
  }

  function submitPw() {
    if (pwInput.value === '202424') {
      closePwModal();
      renderAdminBookingsTable();
      renderAdminCalendar();
      renderBlockedListTable();
      el.adminModal.style.display = 'flex';
    } else {
      pwError.style.display = 'block';
      // Re-trigger shake animation
      pwError.style.animation = 'none';
      void pwError.offsetWidth;
      pwError.style.animation = '';
      pwInput.value = '';
      pwInput.focus();
    }
  }

  el.openAdminBtn.addEventListener('click', openPwModal);
  pwCancelBtn.addEventListener('click', closePwModal);
  pwConfirmBtn.addEventListener('click', submitPw);
  pwInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitPw();
    if (e.key === 'Escape') closePwModal();
  });
  pwModal.addEventListener('click', (e) => {
    if (e.target === pwModal) closePwModal();
  });

  el.closeAdminBtn.addEventListener('click', () => {
    el.adminModal.style.display = 'none';
  });

  el.adminModal.addEventListener('click', (e) => {
    if (e.target === el.adminModal) {
      el.adminModal.style.display = 'none';
    }
  });

  // Admin Tab Switcher
  function switchAdminTab(targetTab) {
    if (el.tabBookings) el.tabBookings.classList.remove('active');
    if (el.tabCalendar) el.tabCalendar.classList.remove('active');
    if (el.tabSchedules) el.tabSchedules.classList.remove('active');

    if (el.adminBookingsPanel) el.adminBookingsPanel.style.display = 'none';
    if (el.adminCalendarPanel) el.adminCalendarPanel.style.display = 'none';
    if (el.adminSchedulesPanel) el.adminSchedulesPanel.style.display = 'none';

    if (targetTab === 'bookings') {
      if (el.tabBookings) el.tabBookings.classList.add('active');
      if (el.adminBookingsPanel) el.adminBookingsPanel.style.display = 'block';
      renderAdminBookingsTable();
    } else if (targetTab === 'calendar') {
      if (el.tabCalendar) el.tabCalendar.classList.add('active');
      if (el.adminCalendarPanel) el.adminCalendarPanel.style.display = 'block';
      renderAdminCalendar();
    } else if (targetTab === 'schedules') {
      if (el.tabSchedules) el.tabSchedules.classList.add('active');
      if (el.adminSchedulesPanel) el.adminSchedulesPanel.style.display = 'block';
      renderBlockedListTable();
    }
  }

  if (el.tabBookings) el.tabBookings.addEventListener('click', () => switchAdminTab('bookings'));
  if (el.tabCalendar) el.tabCalendar.addEventListener('click', () => switchAdminTab('calendar'));
  if (el.tabSchedules) el.tabSchedules.addEventListener('click', () => switchAdminTab('schedules'));

  // Admin Calendar Navigation
  if (el.adminCalPrev) {
    el.adminCalPrev.addEventListener('click', () => {
      state.adminCalendarMonth.setMonth(state.adminCalendarMonth.getMonth() - 1);
      renderAdminCalendar();
    });
  }
  if (el.adminCalNext) {
    el.adminCalNext.addEventListener('click', () => {
      state.adminCalendarMonth.setMonth(state.adminCalendarMonth.getMonth() + 1);
      renderAdminCalendar();
    });
  }

  // Schedule Mode Toggle (Weekly vs Single Date)
  if (el.modeWeeklyBtn && el.modeSingleBtn) {
    el.modeWeeklyBtn.addEventListener('click', () => {
      el.modeWeeklyBtn.classList.add('active');
      el.modeSingleBtn.classList.remove('active');
      if (el.weeklyBlockForm) el.weeklyBlockForm.style.display = 'block';
      if (el.singleBlockForm) el.singleBlockForm.style.display = 'none';
    });

    el.modeSingleBtn.addEventListener('click', () => {
      el.modeSingleBtn.classList.add('active');
      el.modeWeeklyBtn.classList.remove('active');
      if (el.singleBlockForm) el.singleBlockForm.style.display = 'block';
      if (el.weeklyBlockForm) el.weeklyBlockForm.style.display = 'none';
    });
  }

  // Multi-select Checkbox events for Weekly Recurring Blocks
  document.querySelectorAll('input[name="weeklyDay"], input[name="weeklyTime"]').forEach(cb => {
    cb.addEventListener('change', updateWeeklySelectionSummary);
  });

  // Quick select buttons for Weekdays
  if (el.btnDaysAll) {
    el.btnDaysAll.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyDay"]').forEach(c => c.checked = true);
      updateWeeklySelectionSummary();
    });
  }
  if (el.btnDaysWeekday) {
    el.btnDaysWeekday.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyDay"]').forEach(c => {
        const val = Number(c.value);
        c.checked = (val >= 1 && val <= 5);
      });
      updateWeeklySelectionSummary();
    });
  }
  if (el.btnDaysWeekend) {
    el.btnDaysWeekend.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyDay"]').forEach(c => {
        const val = Number(c.value);
        c.checked = (val === 0 || val === 6);
      });
      updateWeeklySelectionSummary();
    });
  }
  if (el.btnDaysClear) {
    el.btnDaysClear.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyDay"]').forEach(c => c.checked = false);
      updateWeeklySelectionSummary();
    });
  }

  // Quick select buttons for Times
  if (el.btnTimesAll) {
    el.btnTimesAll.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyTime"]').forEach(c => {
        if (c.value !== 'ALL' && c.value.endsWith(':00')) c.checked = true;
      });
      updateWeeklySelectionSummary();
    });
  }
  if (el.btnTimesMorning) {
    el.btnTimesMorning.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyTime"]').forEach(c => {
        if (c.value !== 'ALL') {
          const hour = parseInt(c.value.split(':')[0], 10);
          c.checked = (hour >= 10 && hour <= 14);
        }
      });
      updateWeeklySelectionSummary();
    });
  }
  if (el.btnTimesEvening) {
    el.btnTimesEvening.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyTime"]').forEach(c => {
        if (c.value !== 'ALL') {
          const hour = parseInt(c.value.split(':')[0], 10);
          c.checked = (hour >= 15 && hour <= 20);
        }
      });
      updateWeeklySelectionSummary();
    });
  }
  if (el.btnTimesClear) {
    el.btnTimesClear.addEventListener('click', () => {
      document.querySelectorAll('input[name="weeklyTime"]').forEach(c => c.checked = false);
      updateWeeklySelectionSummary();
    });
  }

  // View Toggle for Weekly Timetable vs Traditional List
  if (el.btnViewTimetable && el.btnViewList) {
    el.btnViewTimetable.addEventListener('click', () => {
      el.btnViewTimetable.classList.add('active');
      el.btnViewList.classList.remove('active');
      if (el.weeklyTimetableView) el.weeklyTimetableView.style.display = 'block';
      if (el.weeklyListView) el.weeklyListView.style.display = 'none';
    });

    el.btnViewList.addEventListener('click', () => {
      el.btnViewList.classList.add('active');
      el.btnViewTimetable.classList.remove('active');
      if (el.weeklyTimetableView) el.weeklyTimetableView.style.display = 'none';
      if (el.weeklyListView) el.weeklyListView.style.display = 'block';
    });
  }

  if (el.addWeeklyBlockBtn) {
    el.addWeeklyBlockBtn.addEventListener('click', addWeeklyBlockedSchedule);
  }
  if (el.addBlockBtn) {
    el.addBlockBtn.addEventListener('click', addBlockedSchedule);
  }
  if (el.exportCsvBtn) {
    el.exportCsvBtn.addEventListener('click', exportCsv);
  }
}

// ──────────────────────────────────────────────
// App Bootstrap (Supabase 데이터 로드 후 UI 초기화)
// ──────────────────────────────────────────────
async function init() {
  // 로딩 중 버튼 비활성화
  const submitBtn = document.getElementById('submitBookingBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '데이터 불러오는 중...'; }

  await loadAllData();   // Supabase에서 전체 데이터 로드
  subscribeRealtime();   // 실시간 구독 시작 (모든 기기 동기화)

  initEventListeners();
  updateWeeklySelectionSummary();
  renderCalendar();
  renderTimeSlots();
  updateReviewCard();
  updateAdminCounters();

  if (el.blockDateInput) el.blockDateInput.min = formatDate(new Date());

  // 로딩 완료
  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '상담 예약 신청 완료하기'; }
}

document.addEventListener('DOMContentLoaded', init);
