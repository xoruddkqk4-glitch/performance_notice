"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ADMIN_EMAIL, ADMIN_UID, firebaseAuth } from "./firebase";
import { firestore } from "./firebase";

type Assessment = {
  id: number;
  subject: string;
  title: string;
  date: string;
  period: string;
  kind: string;
  color: "blue" | "orange" | "purple" | "green" | "pink" | "gray";
  templateLink?: string;
  term?: string;
  className?: string;
  supplies?: string;
  attachmentName?: string;
};

type Editor = { id: number; name: string; username: string; password: string; className: string };

const initialAssessments: Assessment[] = [
  { id: 1, subject: "국어", title: "문학 작품 분석", date: "8월 11일 (화)", period: "3교시", kind: "발표", color: "pink", templateLink: "https://example.com", term: "2026학년도 2학기", className: "3학년 2반" },
  { id: 2, subject: "수학", title: "함수 개념 확인", date: "8월 14일 (금)", period: "2교시", kind: "시험", color: "blue", term: "2026학년도 2학기", className: "3학년 2반" },
  { id: 3, subject: "영어", title: "Unit 4 말하기", date: "8월 18일 (화)", period: "4교시", kind: "말하기", color: "purple", term: "2026학년도 2학기", className: "3학년 2반" },
  { id: 4, subject: "과학", title: "생태계 탐구 보고서", date: "8월 21일 (금)", period: "제출", kind: "보고서", color: "green", term: "2026학년도 2학기", className: "3학년 2반" },
];

export default function Home() {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("수행평가 일정은 변경될 수 있으니 수업 시간에 한 번 더 확인해 주세요.");
  const [screen, setScreen] = useState<"notice" | "dashboard">("notice");
  const [calendarView, setCalendarView] = useState<"월간" | "2주" | "주간" | "일간" | "과목 카드">("월간");
  const [term, setTerm] = useState("2026학년도 2학기");
  const [className, setClassName] = useState("3학년 2반");
  const [editors, setEditors] = useState<Editor[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 7, 1));

  useEffect(() => {
    return onSnapshot(doc(firestore, "appState", "schedules"), (snapshot) => {
      const data = snapshot.data() as { assessments?: Assessment[] } | undefined;
      if (data?.assessments) setAssessments(data.assessments);
    });
  }, []);

  const persistAssessments = (next: Assessment[]) => {
    setAssessments(next);
    void setDoc(doc(firestore, "appState", "schedules"), { assessments: next, updatedAt: new Date().toISOString() });
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sharedClass = query.get("class");
    const sharedTerm = query.get("term");
    if (sharedClass) setClassName(sharedClass);
    if (sharedTerm) setTerm(sharedTerm);
  }, []);

  const visibleAssessments = useMemo(() => assessments.filter((item) => item.term === term && item.className === className), [assessments, term, className]);
  const nextAssessment = useMemo(() => visibleAssessments[0], [visibleAssessments]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const username = String(data.get("username"));
    const password = String(data.get("password"));
    let canEdit = editors.some((editor) => editor.username === username && editor.password === password);
    if (username === "admin") {
      try { const credential = await signInWithEmailAndPassword(firebaseAuth, ADMIN_EMAIL, password); canEdit = credential.user.uid === ADMIN_UID; } catch { canEdit = false; }
    }
    if (canEdit) {
      setIsAdmin(true);
      setIsLoginOpen(false);
      setScreen("dashboard");
      setLoginError("");
      event.currentTarget.reset();
      return;
    }
    setLoginError("아이디 또는 비밀번호를 다시 확인해 주세요.");
  }

  if (screen === "dashboard" && isAdmin) {
    return <Dashboard assessments={visibleAssessments} onAdd={(item) => persistAssessments([...assessments, { ...item, term, className }])} onDelete={(id) => persistAssessments(assessments.filter((item) => item.id !== id))} onEdit={(updated) => persistAssessments(assessments.map((item) => item.id === updated.id ? { ...updated, term, className } : item))} calendarView={calendarView} setCalendarView={setCalendarView} term={term} setTerm={setTerm} className={className} setClassName={setClassName} editors={editors} setEditors={setEditors} onBack={() => setScreen("notice")} onLogout={() => { setIsAdmin(false); setScreen("notice"); }} />;
  }

  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="주요 메뉴">
          <a className="brand" href="#schedule"><span>{(() => { const m = term.match(/(\d{4}).*?(\d)학기/); return m ? `${m[1].slice(2)}-${m[2]}` : term; })()}</span>{className}</a>
          <button className="admin-trigger" onClick={() => isAdmin ? setScreen("dashboard") : setIsLoginOpen(true)}>
            {isAdmin ? "관리 대시보드" : "회장님 로그인"}
          </button>
        </nav>

        <div className="hero-content">
          <p className="eyebrow">PERFORMANCE TASK CALENDAR</p>
          <h1>수행평가, <em>한눈에</em><br />확인하세요.</h1>
          <p className="hero-copy">{term} {className}의 수행평가 일정과 준비물을<br />놓치지 않도록 모아두었어요.</p>
          <a className="scroll-link" href="#schedule">이번 달 일정 보기 <span>↓</span></a>
        </div>
        <div className="hero-shape shape-one" />
        <div className="hero-shape shape-two" />
        <div className="hero-note">CHECK<br />YOUR<br />SCHEDULE</div>
      </section>

      <section id="schedule" className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">{term.toUpperCase()}</p>
            <h2>{className} 수행평가 일정</h2>
          </div>
          <div className="next-chip"><span>다음 일정</span><strong>{nextAssessment?.date ?? "일정 없음"}</strong></div>
        </div>

        <FixedCalendar assessments={visibleAssessments} view={calendarView} setView={setCalendarView} date={calendarDate} setDate={setCalendarDate} />
      </section>

      <section className="notice-band">
        <p className="notice-label">CLASS NOTICE</p>
        <p>{notice}</p>
        <span>✦</span>
      </section>

      <footer><span>{className} PERFORMANCE NOTICE</span><span>학생은 로그인 없이 자유롭게 확인할 수 있어요.</span></footer>

      {isLoginOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsLoginOpen(false)}>
          <form className="login-modal" onSubmit={login} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="close" onClick={() => setIsLoginOpen(false)} aria-label="닫기">×</button>
            <p className="eyebrow dark">CLASS PRESIDENT ONLY</p><h2>관리자 로그인</h2>
            <p className="login-copy">수행평가 일정을 등록하고 수정할 수 있어요.</p>
            <label>아이디<input name="username" autoComplete="username" placeholder="admin" required /></label>
            <label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>
            {loginError && <p className="error">{loginError}</p>}
            <button className="login-submit" type="submit">관리 화면으로 들어가기</button>
            <p className="hint">회장에게 받은 계정으로 로그인해 주세요.</p>
          </form>
        </div>
      )}
    </main>
  );
}

function PublicCalendar({ assessments, view, setView, date, setDate, onDelete, onEdit }: { assessments: Assessment[]; view: "월간" | "2주" | "주간" | "일간" | "과목 카드"; setView: (view: "월간" | "2주" | "주간" | "일간" | "과목 카드") => void; date: Date; setDate: (date: Date) => void; onDelete?: (id: number) => void; onEdit?: (item: Assessment) => void }) {
  const year = date.getFullYear(), month = date.getMonth(), count = new Date(year, month + 1, 0).getDate(), now = new Date();
  const [selected, setSelected] = useState<Assessment | null>(null); const periods = ["1교시", "2교시", "3교시", "4교시", "5교시", "6교시", "7교시"];
  const eventsFor = (day: number) => assessments.filter((item) => { const m = item.date.match(/(\d+)월\s*(\d+)일/); return m && Number(m[1]) === month + 1 && Number(m[2]) === day; });
  const eventsThisMonth = assessments.filter((item) => { const m = item.date.match(/(\d+)월\s*(\d+)일/); return m && Number(m[1]) === month + 1; });
  const move = (amount: number) => { if (view === "2주") setDate(new Date(year, month, date.getDate() + amount * 14)); else if (view === "주간") setDate(new Date(year, month, date.getDate() + amount * 7)); else if (view === "일간") setDate(new Date(year, month, date.getDate() + amount)); else setDate(new Date(year, month + amount, 1)); }; const calendarDays = view === "2주" ? 14 : view === "주간" ? 7 : count;
  const format = (value: Date) => `${value.getFullYear()}년 ${String(value.getMonth() + 1).padStart(2, "0")}월 ${String(value.getDate()).padStart(2, "0")}일`; const end = new Date(year, month, date.getDate() + (view === "2주" ? 13 : view === "주간" ? 6 : 0)); const heading = view === "일간" ? format(date) : view === "2주" || view === "주간" ? `${format(date)} - ${format(end)}` : `${year}년 ${month + 1}월`;
  return <><div className="view-tabs public-tabs">{(["과목 카드", "월간", "2주", "주간", "일간"] as const).map((item) => <button key={item} className={view === item ? "selected" : ""} onClick={() => setView(item)}>{item === "과목 카드" ? "카드뷰" : `${item}뷰`}</button>)}<span className="print-actions"><button onClick={() => window.print()}>PDF 출력</button></span></div><section className="calendar-panel public-calendar"><div className="calendar-title"><div className="calendar-nav"><button className="today-button" onClick={() => setDate(new Date())}>오늘</button><button onClick={() => move(-1)}>‹</button><button onClick={() => move(1)}>›</button></div><div><strong>{heading}</strong><span>{view === "과목 카드" ? "이번 달 수행평가" : "수행평가 일정"}</span></div></div>{view === "과목 카드" ? <div className="dashboard-cards">{eventsThisMonth.map((item, index) => <article className={`schedule-card ${item.color}`} key={item.id}><div className="card-top"><span>{String(index + 1).padStart(2, "0")}</span></div><h3>[{item.subject}]{item.title}({item.period})</h3><div className="card-bottom"><span>{item.date}</span>{item.templateLink ? <a href={item.templateLink} target="_blank">양식 ↗</a> : <b>{item.period}</b>}</div>{onDelete && <div className="card-actions"><button onClick={() => onEdit?.(item)}>수정</button><button onClick={() => { if (window.confirm(`[${item.subject}] ${item.title} 일정을 삭제할까요?`)) onDelete(item.id); }}>삭제</button></div>}</article>)}{eventsThisMonth.length === 0 && <p className="empty-schedule">이번 달 등록된 수행평가가 없어요.</p>}</div> : view === "일간" ? <div className="period-grid">{periods.map((period) => <div className="period-row" key={period}><b>{period}</b><div>{eventsFor(date.getDate()).filter((event) => event.period === period).map((event) => <button className={`event-dot ${event.color}`} key={event.id} onClick={() => setSelected(event)}>[{event.subject}]{event.title}({event.period})</button>)}</div></div>)}</div> : <><div className="weekdays">{["일", "월", "화", "수", "목", "금", "토"].map((item) => <span key={item}>{item}</span>)}</div><div className={`month-grid ${view !== "월간" ? "compact-grid" : ""}`}>{Array.from({ length: calendarDays }, (_, index) => index + 1).map((day) => <div className={`day-cell ${year === now.getFullYear() && month === now.getMonth() && day === now.getDate() ? "today" : ""}`} key={day}><span>{day}</span>{eventsFor(day).map((event) => <button className={`event-dot ${event.color}`} key={event.id} onClick={() => setSelected(event)}>[{event.subject}]{event.title}({event.period})</button>)}</div>)}</div></>}</section>{selected && <div className="detail-backdrop" onClick={() => setSelected(null)}><article className={`detail-card schedule-card ${selected.color}`} onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><p className="eyebrow dark">SCHEDULE DETAIL</p><h3>[{selected.subject}]{selected.title}({selected.period})</h3><p>{selected.date} · {selected.kind}</p>{selected.templateLink && <a href={selected.templateLink} target="_blank">양식 링크 열기 ↗</a>}</article></div>}</>;
}

function FixedCalendar(props: { assessments: Assessment[]; view: "월간" | "2주" | "주간" | "일간" | "과목 카드"; setView: (view: "월간" | "2주" | "주간" | "일간" | "과목 카드") => void; date: Date; setDate: (date: Date) => void; onDelete?: (id: number) => void; onEdit?: (item: Assessment) => void }) {
  const { assessments, view, setView, date, setDate, onDelete, onEdit } = props;
  const [selected, setSelected] = useState<Assessment | null>(null);
  if (view === "과목 카드") return <PublicCalendar {...props} />;
  const step = view === "2주" ? 14 : view === "주간" ? 7 : view === "일간" ? 1 : 0;
  const start = view === "월간" ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date(date);
  const length = view === "월간" ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() : step;
  const cells = Array.from({ length }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const format = (value: Date) => `${value.getFullYear()}년 ${String(value.getMonth() + 1).padStart(2, "0")}월 ${String(value.getDate()).padStart(2, "0")}일`;
  const heading = view === "일간" ? format(start) : view === "월간" ? `${start.getFullYear()}년 ${start.getMonth() + 1}월` : `${format(start)} - ${format(cells[cells.length - 1])}`;
  const move = (amount: number) => setDate(view === "월간" ? new Date(date.getFullYear(), date.getMonth() + amount, 1) : new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount * step));
  const eventsFor = (day: Date) => assessments.filter((item) => { const m = item.date.match(/(\d+)월\s*(\d+)일/); return m && Number(m[1]) === day.getMonth() + 1 && Number(m[2]) === day.getDate(); });
  const now = new Date();
  return <><div className="view-tabs public-tabs">{(["과목 카드", "월간", "2주", "주간", "일간"] as const).map((item) => <button key={item} className={view === item ? "selected" : ""} onClick={() => setView(item)}>{item === "과목 카드" ? "카드뷰" : `${item}뷰`}</button>)}<span className="print-actions"><button onClick={() => window.print()}>PDF 출력</button></span></div><section className="calendar-panel public-calendar"><div className="calendar-title"><div className="calendar-nav"><button className="today-button" onClick={() => setDate(new Date())}>오늘</button><button onClick={() => move(-1)}>‹</button><button onClick={() => move(1)}>›</button></div><div><strong>{heading}</strong><span>수행평가 일정</span></div></div>{view === "일간" ? <div className="period-grid">{["1교시", "2교시", "3교시", "4교시", "5교시", "6교시", "7교시"].map((period) => <div className="period-row" key={period}><b>{period}</b><div>{eventsFor(start).filter((event) => event.period.startsWith(period)).map((event) => <button className={`event-dot ${event.color}`} key={event.id} onClick={() => setSelected(event)}>[{event.subject}]{event.title}({event.period})</button>)}</div></div>)}</div> : <><div className="weekdays">{["일", "월", "화", "수", "목", "금", "토"].map((item) => <span key={item}>{item}</span>)}</div><div className={`month-grid ${view !== "월간" ? "compact-grid" : ""}`}>{cells.map((day) => <div className={`day-cell ${day.toDateString() === now.toDateString() ? "today" : ""}`} key={day.toISOString()}><span>{day.getDate()}</span>{eventsFor(day).map((event) => <button className={`event-dot ${event.color}`} key={event.id} onClick={() => setSelected(event)}>[{event.subject}]{event.title}({event.period})</button>)}</div>)}</div></>}</section>{selected && <div className="detail-backdrop" onClick={() => setSelected(null)}><article className={`detail-card schedule-card ${selected.color}`} onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><p className="eyebrow dark">SCHEDULE DETAIL</p><h3>[{selected.subject}]{selected.title}({selected.period})</h3><p>{selected.date} · {selected.kind}</p>{selected.templateLink && <a href={selected.templateLink} target="_blank">양식 링크 열기 ↗</a>}</article></div>}</>;
}

function Dashboard({ assessments, onAdd, onDelete, onEdit, calendarView, setCalendarView, term, setTerm, className, setClassName, editors, setEditors, onBack, onLogout }: {
  assessments: Assessment[]; onAdd: (item: Assessment) => void; onDelete: (id: number) => void; onEdit: (item: Assessment) => void; calendarView: "월간" | "2주" | "주간" | "일간" | "과목 카드"; setCalendarView: (view: "월간" | "2주" | "주간" | "일간" | "과목 카드") => void;
  term: string; setTerm: (term: string) => void; className: string; setClassName: (name: string) => void; editors: Editor[]; setEditors: (editors: Editor[]) => void; onBack: () => void; onLogout: () => void;
}) {
  const [tab, setTab] = useState<"calendar" | "members">("calendar");
  const [invite, setInvite] = useState({ name: "", username: "", password: "" });
  const [entry, setEntry] = useState({ subject: "", title: "", date: "", endDate: "", period: "", endPeriod: "", kind: "설명", supplies: "", templateLink: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [dashboardDate, setDashboardDate] = useState(new Date(2026, 7, 1));
  const [terms, setTerms] = useState(["2026학년도 1학기", "2026학년도 2학기"]);
  const [classesByTerm, setClassesByTerm] = useState<Record<string, string[]>>({
    "2026학년도 1학기": ["2학년 1반", "2학년 2반"],
    "2026학년도 2학기": ["3학년 2반", "3학년 3반"],
  });
  const [newTerm, setNewTerm] = useState(""); const [newClass, setNewClass] = useState(""); const [addingTerm, setAddingTerm] = useState(false); const [addingClass, setAddingClass] = useState(false);
  const termClasses = classesByTerm[term] ?? [];
  function inviteEditor(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!invite.name || !invite.username || !invite.password) return; setEditors([...editors, { id: Date.now(), ...invite, className }]); setInvite({ name: "", username: "", password: "" }); }
  const resetEntry = () => { setEntry({ subject: "", title: "", date: "", endDate: "", period: "", endPeriod: "", kind: "설명", supplies: "", templateLink: "" }); setAttachment(null); setEditingId(null); };
  function addEntry(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!entry.subject || !entry.title || !entry.date || !entry.period) return; const toLabel = (value: string) => { const [, m, d] = value.match(/\d{4}-(\d{2})-(\d{2})/) ?? []; return `${Number(m)}월 ${Number(d)}일`; }; const color = ({ "국어":"pink", "영어":"purple", "수학":"blue", "사회":"orange", "과학":"green" } as Record<string, Assessment["color"]>)[entry.subject] ?? "gray"; const updated = { id: editingId ?? Date.now(), subject: entry.subject, title: entry.title, date: entry.endDate ? `${toLabel(entry.date)} ~ ${toLabel(entry.endDate)}` : toLabel(entry.date), period: entry.endPeriod ? `${entry.period}~${entry.endPeriod}` : entry.period, kind: entry.kind, templateLink: entry.templateLink, attachmentName: attachment?.name, color }; if (editingId) onEdit(updated); else onAdd(updated); resetEntry(); }
  function startEditing(item: Assessment) { const year = term.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear()); const dates = [...item.date.matchAll(/(\d+)월\s*(\d+)일/g)].map((match) => `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`); const [period, endPeriod = ""] = item.period.split("~"); setEntry({ subject: item.subject, title: item.title, date: dates[0] ?? "", endDate: dates[1] ?? "", period, endPeriod, kind: item.kind, supplies: item.supplies ?? "", templateLink: item.templateLink ?? "" }); setEditingId(item.id); document.getElementById("schedule-entry")?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  const shareLink = typeof window === "undefined" ? "" : `${window.location.origin}/?class=${encodeURIComponent(className)}&term=${encodeURIComponent(term)}`;
  const shareQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(shareLink)}`;
  const copyShareLink = async () => { await navigator.clipboard?.writeText(shareLink); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const subjectOrder: Array<[string, Assessment["color"]]> = [["국어", "pink"], ["영어", "purple"], ["수학", "blue"], ["사회", "orange"], ["과학", "green"], ["기타", "gray"]];
  const eventsBySubject = subjectOrder.map(([subject, color]) => ({ subject, color, items: assessments.filter((item) => subject === "기타" ? !["국어", "영어", "수학", "사회", "과학"].includes(item.subject) : item.subject === subject).sort((a, b) => {
    const dateNumber = (item: Assessment) => { const match = item.date.match(/(\d+)월\s*(\d+)일/); return match ? Number(match[1]) * 100 + Number(match[2]) : Number.MAX_SAFE_INTEGER; };
    return dateNumber(a) - dateNumber(b);
  }) }));
  const activeSubjectGroups = eventsBySubject.filter(({ items }) => items.length > 0);
  return <main className="dashboard">
    <aside className="side-nav"><a className="brand dash-brand" href="#top"><span>{(() => { const m = term.match(/(\d{4}).*?(\d)학기/); return m ? `${m[1].slice(2)}-${m[2]}` : term; })()}</span>{className}</a><p className="side-label">{term} · ADMIN CONSOLE</p><button className={tab === "calendar" ? "side-active" : ""} onClick={() => setTab("calendar")}>▦&nbsp; 수행평가 일정</button><button className={tab === "members" ? "side-active" : ""} onClick={() => setTab("members")}>♙&nbsp; 입력 권한 관리</button><div className="side-bottom"><button onClick={onBack}>← 학생용 공지 보기</button><button onClick={onLogout}>로그아웃</button></div></aside>
    <section className="dash-main" id="top"><header className="dash-header"><div><p className="eyebrow dark">CLASS MANAGEMENT</p><h1>{tab === "calendar" ? "수행평가 대시보드" : "입력 권한 관리"}</h1></div><span className="admin-badge">회장 관리자</span></header>
      {tab === "calendar" ? <>
        <div className="choice-panels"><section><b>학기 선택</b><button className="plus-create" onClick={() => setAddingTerm(!addingTerm)}>＋</button>{addingTerm && <form className="inline-add" onSubmit={(event) => { event.preventDefault(); const nextTerm = newTerm.trim(); if (nextTerm && !terms.includes(nextTerm)) { setTerms([...terms, nextTerm]); setClassesByTerm({ ...classesByTerm, [nextTerm]: [] }); setTerm(nextTerm); setClassName(""); } setNewTerm(""); setAddingTerm(false); }}><input autoFocus value={newTerm} onChange={(event) => setNewTerm(event.target.value)} placeholder="새 학기명"/><button>추가</button></form>}<div>{terms.map((item) => <span className="choice-item" key={item}><button className={term === item ? "chosen" : ""} onClick={() => { setTerm(item); setClassName((classesByTerm[item] ?? [])[0] ?? ""); }}>{item}</button><button className="choice-delete" onClick={() => { if (terms.length === 1 || !window.confirm(`'${item}' 학기를 삭제할까요?`)) return; const next = terms.filter((value) => value !== item); const { [item]: _, ...nextClassesByTerm } = classesByTerm; setTerms(next); setClassesByTerm(nextClassesByTerm); if (term === item) { setTerm(next[0]); setClassName((nextClassesByTerm[next[0]] ?? [])[0] ?? ""); } }}>×</button></span>)}</div></section><section><b>학급 선택</b><button className="plus-create" onClick={() => setAddingClass(!addingClass)}>＋</button>{addingClass && <form className="inline-add" onSubmit={(event) => { event.preventDefault(); const nextClass = newClass.trim(); if (nextClass && !termClasses.includes(nextClass)) { setClassesByTerm({ ...classesByTerm, [term]: [...termClasses, nextClass] }); setClassName(nextClass); } setNewClass(""); setAddingClass(false); }}><input autoFocus value={newClass} onChange={(event) => setNewClass(event.target.value)} placeholder="새 학급명"/><button>추가</button></form>}<div>{termClasses.map((item) => <span className="choice-item" key={item}><button className={className === item ? "chosen" : ""} onClick={() => setClassName(item)}>{item}</button><button className="choice-delete" onClick={() => { if (!window.confirm(`'${item}' 학급을 삭제할까요?`)) return; const next = termClasses.filter((value) => value !== item); setClassesByTerm({ ...classesByTerm, [term]: next }); if (className === item) setClassName(next[0] ?? ""); }}>×</button></span>)}</div></section></div>
        <section className="share-panel"><p className="eyebrow dark">SCHEDULE SHARE</p><h2>일정 공유</h2><p>학생용 공유 페이지: <code>{shareLink}</code></p><button className={`copy-link ${copied ? "copied" : ""}`} onClick={copyShareLink}>{copied ? "복사됨 ✓" : "링크 복사"}</button><img className="share-qr" src={shareQr} alt={`${term} ${className} 학생용 공유 페이지 QR 코드`} /></section>
        <section className="all-events-panel"><div className="all-events-heading"><div><p className="eyebrow dark">ALL SCHEDULES</p><h2>{term} · {className} 전체 일정</h2></div><span>{assessments.length}건</span></div>{activeSubjectGroups.length ? <div className={`subject-event-groups count-${activeSubjectGroups.length}`} style={{ gridTemplateColumns: `repeat(${activeSubjectGroups.length}, minmax(0, 1fr))` }}>{activeSubjectGroups.map(({ subject, color, items }) => <section className={`subject-event-group ${color}`} key={subject}><h3>{subject}</h3>{items.map((item) => <div className="event-list-row" key={item.id}><span>{item.date} · {item.title} ({item.period})</span></div>)}</section>)}</div> : <p className="empty-schedule">선택한 학기와 학급에 등록된 일정이 없어요.</p>}</section>
        <FixedCalendar assessments={assessments} view={calendarView} setView={setCalendarView} date={dashboardDate} setDate={setDashboardDate} onDelete={onDelete} onEdit={startEditing} />
        <section className="entry-panel" id="schedule-entry"><div><p className="eyebrow dark">SCHEDULE INPUT</p><h2>{editingId ? "일정 수정" : "일정 입력 및 공유"}</h2></div><form className="entry-form" onSubmit={addEntry}><input placeholder="과목" value={entry.subject} onChange={(e) => setEntry({ ...entry, subject: e.target.value })}/><input placeholder="제목" value={entry.title} onChange={(e) => setEntry({ ...entry, title: e.target.value })}/><label>시작일<input type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })}/></label><label>종료일 (기간 선택)<input type="date" value={entry.endDate} min={entry.date} onChange={(e) => setEntry({ ...entry, endDate: e.target.value })}/></label><label>교시<select value={entry.period} onChange={(e) => setEntry({ ...entry, period: e.target.value })}><option value="">선택</option>{["1교시", "2교시", "3교시", "4교시", "5교시", "6교시", "7교시", "제출"].map((item) => <option key={item}>{item}</option>)}</select></label><input placeholder="설명" value={entry.kind} onChange={(e) => setEntry({ ...entry, kind: e.target.value })}/><input placeholder="양식 링크 (선택)" value={entry.templateLink} onChange={(e) => setEntry({ ...entry, templateLink: e.target.value })}/><label className="attachment-input">첨부 파일 (선택)<input type="file" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} /></label><button>{editingId ? "일정 수정" : "일정 추가"}</button>{editingId && <button type="button" className="cancel-edit" onClick={resetEntry}>취소</button>}</form></section>
        <p className="dash-tip">학생들은 공지 화면에서 일정만 확인하며, 편집 권한이 있는 계정만 이 대시보드에서 입력할 수 있습니다.</p>
      </> : <section className="permission-layout"><div className="permission-intro"><p className="eyebrow dark">EDITOR ACCESS</p><h2>누가 일정을 입력할 수 있나요?</h2><p>회장은 필요한 학생에게만 아이디와 비밀번호를 만들어 주고, 해당 학급의 일정 입력 권한을 나눌 수 있어요.</p><form onSubmit={inviteEditor} className="invite-form"><input placeholder="학생 이름" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /><input placeholder="아이디" value={invite.username} onChange={(e) => setInvite({ ...invite, username: e.target.value })} /><input placeholder="임시 비밀번호" value={invite.password} onChange={(e) => setInvite({ ...invite, password: e.target.value })} /><button>입력 권한 부여</button></form></div><div className="member-list"><div className="member-row owner"><span>회장 관리자</span><strong>admin</strong><em>전체 학급 관리</em></div>{editors.map((editor) => <div className="member-row" key={editor.id}><span>{editor.name}</span><strong>{editor.username}</strong><em>{editor.className} 입력 가능</em><button onClick={() => setEditors(editors.filter((item) => item.id !== editor.id))}>권한 해제</button></div>)}</div></section>}
    </section></main>;
}
