import { useEffect, useState } from 'react';

const KEY = 'no-contact-tracker-v1';
const EMPTY = { count: 0, lastTap: null, best: 0 };

// Local calendar date as YYYY-MM-DD (so "today" follows the phone's timezone)
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
};

export default function App() {
  const [data, setData] = useState(load);
  const [confirming, setConfirming] = useState(false);
  const [pop, setPop] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
  }, [data]);

  // Re-check "today" when the app comes back to the foreground after midnight
  useEffect(() => {
    const onVisible = () => setTick((t) => t + 1);
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const doneToday = data.lastTap === today();

  const addDay = () => {
    if (doneToday) return;
    const count = data.count + 1;
    setData({ count, lastTap: today(), best: Math.max(data.best, count) });
    setPop(true);
    setTimeout(() => setPop(false), 450);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const reset = () => {
    setData({ ...data, count: 0, lastTap: null });
    setConfirming(false);
  };

  return (
    <main className="app">
      <header className="top">
        <span className="dot" />
        <h1>No Contact</h1>
      </header>

      <section className="counter">
        <div className={`ring ${pop ? 'pop' : ''}`}>
          <span className="num">{data.count}</span>
          <span className="label">{data.count === 1 ? 'day' : 'days'}</span>
        </div>
        <p className="sub">
          {data.count === 0
            ? 'Day one starts with one tap.'
            : doneToday
              ? 'Today is counted. Come back tomorrow.'
              : 'Still going strong? Log today.'}
        </p>
        {data.best > 0 && <p className="best">Best streak · {data.best} {data.best === 1 ? 'day' : 'days'}</p>}
      </section>

      <footer className="actions">
        <button className="primary" onClick={addDay} disabled={doneToday}>
          {doneToday ? '✓ Logged today' : '+ Add a day'}
        </button>
        <button className="ghost" onClick={() => setConfirming(true)} disabled={data.count === 0}>
          Reset
        </button>
      </footer>

      {confirming && (
        <div className="overlay" onClick={() => setConfirming(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Reset to 0?</h2>
            <p>Your current streak of {data.count} {data.count === 1 ? 'day' : 'days'} will be cleared. That's okay. Starting again still counts.</p>
            <div className="sheet-actions">
              <button className="ghost" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="danger" onClick={reset}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
