import { useState } from "react";

const SUBJECT_COLORS = [
  { hex: "#9C6B4F", soft: "#F2E8E1" },
  { hex: "#4B6E8C", soft: "#E4ECF2" },
  { hex: "#6F8C5A", soft: "#E9F0E3" },
  { hex: "#8A6B9C", soft: "#EFE7F4" },
  { hex: "#B0873F", soft: "#F5EAD9" },
  { hex: "#5C7A7A", soft: "#E5EEEE" },
  { hex: "#A2604F", soft: "#F3E4E0" },
  { hex: "#5A7A9C", soft: "#E4EBF3" },
];

const PRIORITY_LEVELS = [
  { label: "최우선", weight: 5 },
  { label: "높음", weight: 4 },
  { label: "보통", weight: 3 },
  { label: "낮음", weight: 2 },
  { label: "여유", weight: 1 },
];

const PRIORITY_TIPS = {
  최우선: "매일 짧게라도 문제풀이로 기억을 확인하세요. 시험 전날은 새 내용보다 요약 노트 위주로 가볍게 마무리하는 게 안전해요.",
  높음: "개념 정리를 먼저 끝낸 뒤, 기출·모의문제로 적용력을 다지는 데 시간을 쓰세요.",
  보통: "핵심 개념 위주로 정리하고, 시험이 가까워질수록 문제풀이 비중을 점점 늘려보세요.",
  낮음: "일주일에 한 번 정도만 배정돼요. 배정된 날에 그 주 진도를 확실히 끝내두세요.",
  여유: "가장 여유 있는 과목이에요. 평소엔 따로 배정하지 않고, 시험 전날에만 가볍게 훑어보는 걸로 충분해요.",
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmt(d) {
  return `${d.getMonth() + 1}.${d.getDate()}`;
}
function priorityWeight(label) {
  return PRIORITY_LEVELS.find((p) => p.label === label).weight;
}

function buildWeekdayAssignment(rotateSubjects) {
  const assignment = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  rotateSubjects.forEach((s, idx) => {
    const appearances = Math.min(7, Math.max(1, priorityWeight(s.priority) - 1));
    const rotationOffset = (idx * 2) % 7;
    const days = new Set();
    for (let i = 0; i < appearances; i++) {
      const raw = Math.round((i * 7) / appearances) + rotationOffset;
      days.add(((raw % 7) + 7) % 7);
    }
    let filler = 0;
    while (days.size < appearances && filler < 7) {
      days.add((rotationOffset + filler) % 7);
      filler++;
    }
    days.forEach((d) => assignment[d].push(s));
  });
  return assignment;
}

export default function Ppaplan() {
  const [step, setStep] = useState(1);
  const [examStart, setExamStart] = useState("");
  const [examLength, setExamLength] = useState("");
  const [examDays, setExamDays] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const [priorityInput, setPriorityInput] = useState("보통");
  const [dayInputIdx, setDayInputIdx] = useState(0);
  const [weekdayHours, setWeekdayHours] = useState({ 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" });
  const [closeThreshold, setCloseThreshold] = useState("3");
  const [closeHours, setCloseHours] = useState("");
  const [plan, setPlan] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [error, setError] = useState("");
  const [aiComment, setAiComment] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  function goToStep2() {
    if (!examStart) {
      setError("시험 시작일을 선택해 주세요.");
      return;
    }
    const len = Number(examLength);
    if (!len || len < 1) {
      setError("시험 기간(일수)을 정확히 입력해 주세요.");
      return;
    }
    const start = new Date(examStart);
    const list = [];
    for (let i = 0; i < len; i++) list.push({ dayNumber: i + 1, date: addDays(start, i) });
    setExamDays(list);
    setDayInputIdx(0);
    setError("");
    setStep(2);
  }

  function addSubject() {
    if (!nameInput.trim()) {
      setError("과목명을 입력해 주세요.");
      return;
    }
    setError("");
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    setSubjects([
      ...subjects,
      { id: Date.now(), name: nameInput.trim(), priority: priorityInput, examDayIndex: dayInputIdx, color },
    ]);
    setNameInput("");
  }

  function removeSubject(id) {
    setSubjects(subjects.filter((s) => s.id !== id));
  }

  function goToStep3() {
    if (subjects.length === 0) {
      setError("각 일차에 응시할 과목을 한 과목 이상 추가해 주세요.");
      return;
    }
    setError("");
    setStep(3);
  }

  function generatePlan() {
    for (const d of WEEKDAY_ORDER) {
      if (weekdayHours[d] === "" || Number(weekdayHours[d]) < 0) {
        setError("요일별 공부 가능 시간을 모두 입력해 주세요. (0도 가능)");
        return;
      }
    }
    const threshold = Number(closeThreshold);
    const cHours = Number(closeHours);
    if (!threshold || threshold < 1) {
      setError("임박 기준 일수를 정확히 입력해 주세요.");
      return;
    }
    if (!cHours || cHours <= 0) {
      setError("임박했을 때의 하루 공부 시간을 입력해 주세요.");
      return;
    }
    setError("");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastExamDate = examDays[examDays.length - 1].date;

    const subjectsWithDate = subjects.map((s) => ({ ...s, examDate: examDays[s.examDayIndex].date }));
    const rotateSubjects = subjectsWithDate.filter((s) => s.priority !== "여유");
    const weekdayAssignment = buildWeekdayAssignment(rotateSubjects);

    const days = [];
    let cursor = new Date(today);
    let guard = 0;
    while (cursor < lastExamDate && guard < 60) {
      const tomorrow = addDays(cursor, 1);
      const tomorrowExamSubjects = subjectsWithDate.filter((s) => sameDay(s.examDate, tomorrow));
      const isEve = tomorrowExamSubjects.length > 0;

      let pool;
      if (isEve) {
        pool = tomorrowExamSubjects;
      } else {
        const weekday = cursor.getDay();
        pool = weekdayAssignment[weekday].filter((s) => s.examDate > cursor);
        if (pool.length === 0) {
          pool = rotateSubjects.filter((s) => s.examDate > cursor);
        }
      }

      const upcoming = examDays.filter((ed) => ed.date >= cursor);
      const nearestDaysAway =
        upcoming.length > 0
          ? Math.min(...upcoming.map((ed) => Math.round((ed.date - cursor) / 86400000)))
          : 999;
      const isClose = isEve || nearestDaysAway <= threshold;
      const hoursToday = isClose ? cHours : Number(weekdayHours[cursor.getDay()]);

      const weighted = pool.map((s) => {
        const daysUntil = Math.max(1, Math.round((s.examDate - cursor) / 86400000));
        const w = isEve ? priorityWeight(s.priority) : priorityWeight(s.priority) / daysUntil;
        return { s, w };
      });
      const totalW = weighted.reduce((a, b) => a + b.w, 0);

      let allocated = [];
      let runningSum = 0;
      weighted.forEach(({ s, w }) => {
        let h = totalW > 0 && hoursToday > 0 ? (w / totalW) * hoursToday : 0;
        h = Math.round(h * 10) / 10;
        runningSum += h;
        allocated.push({ name: s.name, color: s.color, hours: h });
      });
      const diff = Math.round((hoursToday - runningSum) * 10) / 10;
      if (allocated.length > 0 && Math.abs(diff) >= 0.1) {
        allocated[allocated.length - 1].hours = Math.round((allocated[allocated.length - 1].hours + diff) * 10) / 10;
      }

      days.push({ date: new Date(cursor), isEve, isClose, hoursToday, allocations: allocated });
      cursor = addDays(cursor, 1);
      guard++;
    }

    const tips = subjectsWithDate.map((s) => ({ name: s.name, priority: s.priority, tip: PRIORITY_TIPS[s.priority] }));
    const groupedByDay = {};
    subjectsWithDate.forEach((s) => {
      groupedByDay[s.examDayIndex] = (groupedByDay[s.examDayIndex] || 0) + 1;
    });
    const overlapDays = Object.values(groupedByDay).filter((c) => c >= 2).length;
    const topCount = subjectsWithDate.filter((s) => s.priority === "최우선").length;
    const lowCount = subjectsWithDate.filter((s) => s.priority === "여유").length;

    const overallTips = [];
    if (overlapDays > 0) {
      overallTips.push("같은 날 시험이 겹치는 과목이 있어요. 하루를 여러 블록으로 나눠 번갈아 학습하면 집중력을 유지하기 좋아요.");
    }
    if (topCount >= 2) {
      overallTips.push("'최우선' 과목이 여러 개예요. 하루에 몰아서 하기보다 요일별로 나눠 꾸준히 순환 복습하는 게 효율적이에요.");
    }
    if (lowCount >= 1) {
      overallTips.push("'여유' 과목은 평소 일정에서 빠지고 시험 전날에만 등장해요. 그만큼 다른 과목에 시간을 더 쓸 수 있어요.");
    }

    setPlan({ days, examDays, tips, overallTips, weekdayAssignment });
    setSelectedIdx(null);
    setAiComment("");
    setStep(4);
  }

  async function getAIComment() {
    if (!plan) return;
    setLoadingAI(true);
    setAiComment("");
    try {
      const summary = subjects
        .map(
          (s) =>
            `${s.name}(우선순위 ${s.priority}, ${examDays[s.examDayIndex].dayNumber}일차 시험 ${fmt(examDays[s.examDayIndex].date)})`
        )
        .join(", ");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `너는 고등학생 시험 플래너 AI야. 아래 과목별 우선순위와 시험일 정보를 보고, 학생에게 존댓말로 3~4문장 정도의 구체적인 학습 전략을 제안해줘. 과목이 요일별로 나뉘어 배정되고 우선순위가 가장 낮은 과목은 시험 전날에만 공부한다는 점을 감안해서 조언해줘. 정보: ${summary}`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).map((b) => b.text || "").join("\n");
      setAiComment(text || "코멘트를 가져오지 못했어요.");
    } catch (e) {
      setAiComment("AI 코멘트를 불러오는 중 문제가 생겼어요.");
    }
    setLoadingAI(false);
  }

  function reset() {
    setStep(1);
    setExamStart("");
    setExamLength("");
    setExamDays([]);
    setSubjects([]);
    setWeekdayHours({ 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" });
    setCloseThreshold("3");
    setCloseHours("");
    setPlan(null);
    setSelectedIdx(null);
    setError("");
    setAiComment("");
  }

  let calendarCells = [];
  if (plan) {
    const startPad = plan.days[0].date.getDay();
    for (let i = 0; i < startPad; i++) calendarCells.push(null);
    plan.days.forEach((_, idx) => calendarCells.push(idx));
    while (calendarCells.length % 7 !== 0) calendarCells.push(null);
  }
  const selectedDay = plan && selectedIdx !== null ? plan.days[selectedIdx] : null;

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #D8D2C4",
    fontSize: 14,
    background: "#fff",
  };
  const primaryBtn = {
    background: "#1D1C1A",
    color: "#FAF9F6",
    border: "none",
    borderRadius: 10,
    padding: "11px 22px",
    fontSize: 14,
    fontWeight: 600,
  };
  const ghostBtn = {
    background: "transparent",
    color: "#6B6558",
    border: "1px solid #D8D2C4",
    borderRadius: 10,
    padding: "11px 22px",
    fontSize: 14,
  };

  return (
    <div
      style={{
        fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#14161C",
        padding: "32px 16px",
        minHeight: "100%",
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css');
        .ppaplan-btn { transition: opacity .15s ease, transform .15s ease; cursor: pointer; }
        .ppaplan-btn:hover { opacity: .85; }
        .ppaplan-btn:active { transform: scale(0.98); }
        .cal-cell { transition: box-shadow .12s ease, border-color .12s ease; cursor: pointer; }
        .cal-cell:hover { border-color: #C7A26A; }
        .day-chip { cursor: pointer; }
        .wh-input { width: 100%; text-align: center; }
      `}</style>

      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          background: "#FAF9F6",
          borderRadius: 20,
          padding: "36px 40px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1C1A" }}>빠플</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#8C8578" }}>시험까지, 가장 빠른 플랜</p>
          </div>
          {step === 4 && (
            <button
              className="ppaplan-btn"
              onClick={reset}
              style={{ border: "1px solid #D8D2C4", background: "transparent", borderRadius: 8, padding: "6px 14px", fontSize: 12.5, color: "#6B6558" }}
            >
              처음부터 다시
            </button>
          )}
        </div>

        {step < 4 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 26 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? "#C7A26A" : "#E5DFD1" }} />
            ))}
          </div>
        )}

        {error && <p style={{ color: "#B3462F", fontSize: 13, marginTop: -8, marginBottom: 16 }}>{error}</p>}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1D1C1A", marginBottom: 6 }}>시험 일정을 알려주세요</h2>
            <p style={{ fontSize: 12.5, color: "#8C8578", marginBottom: 16 }}>
              예: 8월 25일부터 5일간 시험이라면, 시작일과 기간을 입력해 주세요.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26, flexWrap: "wrap" }}>
              <label style={{ fontSize: 13, color: "#5B564A", display: "flex", alignItems: "center", gap: 8 }}>
                시작일
                <input type="date" value={examStart} onChange={(e) => setExamStart(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ fontSize: 13, color: "#5B564A", display: "flex", alignItems: "center", gap: 8 }}>
                기간
                <input
                  type="number"
                  min="1"
                  placeholder="5"
                  value={examLength}
                  onChange={(e) => setExamLength(e.target.value)}
                  style={{ ...inputStyle, width: 60 }}
                />
                일간
              </label>
            </div>
            <button className="ppaplan-btn" onClick={goToStep2} style={primaryBtn}>다음</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1D1C1A", marginBottom: 6 }}>일차별 시험 과목을 배정해 주세요</h2>
            <p style={{ fontSize: 12.5, color: "#8C8578", marginBottom: 16 }}>
              우선순위가 높을수록 한 주에 더 자주 배정되고, '여유' 과목은 평소엔 쉬고 시험 전날에만 공부해요.
            </p>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {examDays.map((ed, idx) => (
                <div
                  key={idx}
                  className="day-chip"
                  onClick={() => setDayInputIdx(idx)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    border: dayInputIdx === idx ? "1.5px solid #C7A26A" : "1px solid #D8D2C4",
                    background: dayInputIdx === idx ? "#FBF3E4" : "#fff",
                    color: "#1D1C1A",
                  }}
                >
                  {ed.dayNumber}일차 · {fmt(ed.date)}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                placeholder="과목명 (예: 수학)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <select value={priorityInput} onChange={(e) => setPriorityInput(e.target.value)} style={inputStyle}>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p.label} value={p.label}>우선순위 {p.label}</option>
                ))}
              </select>
              <button
                className="ppaplan-btn"
                onClick={addSubject}
                style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#C7A26A", color: "#fff", fontSize: 14, fontWeight: 600 }}
              >
                추가
              </button>
            </div>

            {examDays.map((ed, idx) => {
              const daySubjects = subjects.filter((s) => s.examDayIndex === idx);
              if (daySubjects.length === 0) return null;
              return (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#8C8578", marginBottom: 6 }}>{ed.dayNumber}일차 ({fmt(ed.date)})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {daySubjects.map((s) => (
                      <div
                        key={s.id}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: s.color.soft, borderRadius: 10, padding: "8px 12px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color.hex, display: "inline-block" }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1C1A" }}>{s.name}</span>
                          <span style={{ fontSize: 12, color: "#7C766A" }}>우선순위 {s.priority}</span>
                        </div>
                        <span onClick={() => removeSubject(s.id)} style={{ cursor: "pointer", fontSize: 13, color: "#A69C88" }}>삭제</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="ppaplan-btn" onClick={() => setStep(1)} style={ghostBtn}>이전</button>
              <button className="ppaplan-btn" onClick={goToStep3} style={primaryBtn}>다음</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1D1C1A", marginBottom: 6 }}>요일별 공부 시간을 설정해 주세요</h2>
            <p style={{ fontSize: 12.5, color: "#8C8578", marginBottom: 14 }}>
              요일마다 공부 가능한 시간이 다르다면 각각 입력하세요. (학원 있는 날은 짧게, 여유로운 날은 길게)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 22 }}>
              {WEEKDAY_ORDER.map((d) => (
                <div key={d} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#5B564A", marginBottom: 6, fontWeight: 600 }}>{DOW[d]}</div>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="wh-input"
                    value={weekdayHours[d]}
                    onChange={(e) => setWeekdayHours({ ...weekdayHours, [d]: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1D1C1A", marginBottom: 6 }}>시험이 임박했을 땐요?</h2>
            <p style={{ fontSize: 12.5, color: "#8C8578", marginBottom: 14 }}>
              시험 며칠 전부터, 요일별 시간 대신 별도의 집중 학습 시간을 쓸지 정해주세요.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 26, flexWrap: "wrap" }}>
              <label style={{ fontSize: 13, color: "#5B564A", display: "flex", alignItems: "center", gap: 8 }}>
                시험
                <input
                  type="number"
                  min="1"
                  value={closeThreshold}
                  onChange={(e) => setCloseThreshold(e.target.value)}
                  style={{ ...inputStyle, width: 56 }}
                />
                일 전부터
              </label>
              <label style={{ fontSize: 13, color: "#5B564A", display: "flex", alignItems: "center", gap: 8 }}>
                하루
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="예: 6"
                  value={closeHours}
                  onChange={(e) => setCloseHours(e.target.value)}
                  style={{ ...inputStyle, width: 70 }}
                />
                시간 집중
              </label>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="ppaplan-btn" onClick={() => setStep(2)} style={ghostBtn}>이전</button>
              <button
                className="ppaplan-btn"
                onClick={generatePlan}
                style={{ background: "#C7A26A", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 600 }}
              >
                플랜 생성하기
              </button>
            </div>
          </div>
        )}

        {step === 4 && plan && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {subjects.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5B564A" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color.hex, display: "inline-block" }} />
                  {s.name} · {s.priority}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {DOW.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 11.5, color: "#A69C88", fontWeight: 600, padding: "4px 0" }}>{d}</div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 22 }}>
              {calendarCells.map((idx, i) => {
                if (idx === null) return <div key={i} style={{ minHeight: 80 }} />;
                const d = plan.days[idx];
                const isSelected = selectedIdx === idx;
                return (
                  <div
                    key={i}
                    className="cal-cell"
                    onClick={() => setSelectedIdx(idx)}
                    style={{
                      minHeight: 80,
                      borderRadius: 8,
                      border: isSelected ? "1.5px solid #C7A26A" : "1px solid #E5DFD1",
                      background: d.isEve ? "#FBF3E4" : "#fff",
                      padding: "6px 6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#A69C88" }}>{fmt(d.date)}{d.isEve ? " · 전날" : ""}</span>
                    {d.allocations.length === 0 ? (
                      <span style={{ fontSize: 10, color: "#C9C4B7" }}>휴식</span>
                    ) : (
                      d.allocations.slice(0, 3).map((a, ai) => (
                        <span key={ai} style={{ fontSize: 10, color: a.color.hex, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.name} {a.hours}h
                        </span>
                      ))
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDay ? (
              <div style={{ background: "#1D1C1A", borderRadius: 14, padding: "18px 20px", marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <span style={{ color: "#FAF9F6", fontSize: 16, fontWeight: 700 }}>{fmt(selectedDay.date)} ({DOW[selectedDay.date.getDay()]})</span>
                  <span style={{ color: "#C7A26A", fontSize: 12.5, fontWeight: 600 }}>
                    {selectedDay.isEve ? "시험 전날 · 해당 과목 집중" : selectedDay.isClose ? "임박 집중 학습" : "일반 학습일"}
                  </span>
                </div>
                {selectedDay.allocations.length === 0 ? (
                  <p style={{ color: "#A69C88", fontSize: 13, margin: 0 }}>이날은 배정된 과목이 없어요.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedDay.allocations.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "#EDEAE2", width: 64 }}>{a.name}</span>
                        <div style={{ flex: 1, height: 8, background: "#33322D", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${selectedDay.hoursToday > 0 ? Math.min(100, (a.hours / selectedDay.hoursToday) * 100) : 0}%`, height: "100%", background: a.color.hex }} />
                        </div>
                        <span style={{ fontSize: 12.5, color: "#C9C4B7", width: 36, textAlign: "right" }}>{a.hours}h</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #33322D", fontSize: 12, color: "#8C8578" }}>
                  총 {selectedDay.hoursToday}시간 계획
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: "#A69C88", textAlign: "center", marginBottom: 22 }}>
                달력에서 날짜를 클릭하면 그날의 학습 배분을 볼 수 있어요.
              </p>
            )}

            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1D1C1A", marginBottom: 10 }}>우선순위 분석 &amp; 학습 팁</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: plan.overallTips.length ? 12 : 20 }}>
              {plan.tips.map((t, i) => (
                <div key={i} style={{ background: "#F2EEE4", borderRadius: 10, padding: "10px 14px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1C1A" }}>
                    {t.name} <span style={{ fontWeight: 400, color: "#8C8578" }}>({t.priority})</span>
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#5B564A", lineHeight: 1.6 }}>{t.tip}</p>
                </div>
              ))}
            </div>
            {plan.overallTips.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
                {plan.overallTips.map((t, i) => (
                  <p key={i} style={{ fontSize: 12.5, color: "#B3462F", margin: 0, lineHeight: 1.6 }}>· {t}</p>
                ))}
              </div>
            )}

            <div style={{ background: "#1D1C1A", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#FAF9F6", fontSize: 14, fontWeight: 700 }}>AI 심층 분석</span>
                <button
                  className="ppaplan-btn"
                  onClick={getAIComment}
                  disabled={loadingAI}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #FAF9F6", background: "transparent", color: "#FAF9F6", fontSize: 12 }}
                >
                  {loadingAI ? "생성 중..." : "AI 코멘트 받기"}
                </button>
              </div>
              <p style={{ color: "#E3DFD3", fontSize: 12.5, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                {aiComment || "버튼을 누르면 우선순위와 시험 일정을 바탕으로 더 구체적인 전략을 제안해줘요."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
