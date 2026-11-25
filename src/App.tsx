import { useState, useEffect, useMemo } from "react";
type Type = "income" | "expense";
type Tx = { id: string; date: string; type: Type; amount: number; category: string; memo: string; pay: string };
type Data = { tx: Tx[]; cats: { income: string[]; expense: string[] }; budgets: Record<string, number> };
const KEY = "kakeibo:v1";
const PAYS = ["現金", "クレジットカード", "電子マネー", "銀行口座"];
const COL = ["#7c9cf5", "#f09a9a", "#6cc3a0", "#f5c77c", "#b79cf0", "#7cd0e0", "#f0a6d0", "#a6c97c", "#e0a77c", "#9aa5c0"];
const yen = (n: number) => (n < 0 ? "-¥" : "¥") + Math.abs(n).toLocaleString("ja-JP");
const pad = (n: number) => String(n).padStart(2, "0");
const ymOf = (d: Date) => d.getFullYear() + "-" + pad(d.getMonth() + 1);
const shift = (ym: string, k: number) => { const [y, m] = ym.split("-").map(Number); return ymOf(new Date(y, m - 1 + k, 1)); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => { const d = new Date(); return ymOf(d) + "-" + pad(d.getDate()); };

function sample(): Data {
  const cur = ymOf(new Date()); const tx: Tx[] = []; let s = 7;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const add = (m: string, day: number, type: Type, amount: number, category: string, memo: string, pay: string) =>
    tx.push({ id: uid(), date: m + "-" + pad(day), type, amount, category, memo, pay });
  for (let i = 5; i >= 0; i--) {
    const m = shift(cur, -i);
    add(m, 25, "income", 280000, "給与", "月給", "銀行口座");
    if (i % 2 === 0) add(m, 15, "income", 20000 + Math.floor(r() * 3) * 10000, "副収入", "副業", "銀行口座");
    add(m, 1, "expense", 78000, "住居費", "家賃", "銀行口座");
    add(m, 10, "expense", 6000 + Math.floor(r() * 3000), "水道光熱費", "電気・ガス・水道", "銀行口座");
    add(m, 12, "expense", 8000, "通信費", "スマホ・光回線", "クレジットカード");
    for (let k = 0; k < 8; k++) add(m, 2 + k * 3, "expense", 800 + Math.floor(r() * 4200), "食費", "スーパー", k % 2 ? "現金" : "電子マネー");
    add(m, 8, "expense", 1500 + Math.floor(r() * 2000), "日用品", "ドラッグストア", "現金");
    add(m, 14, "expense", 5000 + Math.floor(r() * 9000), "交通費", "定期・交通", "電子マネー");
    add(m, 20, "expense", 3000 + Math.floor(r() * 12000), "娯楽費", "映画・外食", "クレジットカード");
    if (i % 3 === 0) add(m, 18, "expense", 3500, "医療費", "通院", "現金");
  }
  return { tx, cats: { income: ["給与", "副収入", "その他"], expense: ["食費", "日用品", "住居費", "水道光熱費", "通信費", "医療費", "教育費", "交通費", "娯楽費", "その他"] },
    budgets: { 食費: 40000, 日用品: 5000, 娯楽費: 10000, 交通費: 10000, 水道光熱費: 9000 } };
}
function load(): Data { try { const t = localStorage.getItem(KEY); if (t) return JSON.parse(t); } catch (e) {} return sample(); }
function valid(o: any): o is Data {
  return o && Array.isArray(o.tx) && o.cats && Array.isArray(o.cats.income) && Array.isArray(o.cats.expense) && o.budgets &&
    o.tx.every((t: any) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && (t.type === "income" || t.type === "expense") && Number.isInteger(t.amount) && t.amount > 0 && typeof t.category === "string");
}

function Pie({ items }: { items: [string, number][] }) {
  const tot = items.reduce((a, b) => a + b[1], 0);
  if (!tot) return <p className="k">データがありません</p>;
  let a0 = -Math.PI / 2;
  const P = (a: number) => [60 + 55 * Math.cos(a), 60 + 55 * Math.sin(a)];
  return <div className="row" style={{ justifyContent: "center" }}>
    <svg viewBox="0 0 120 120" width="150" height="150">
      {items.map(([n, v], i) => { if (items.length === 1) return <circle key={n} cx="60" cy="60" r="55" fill={COL[0]} />;
        const a1 = a0 + (v / tot) * 2 * Math.PI; const [x0, y0] = P(a0), [x1, y1] = P(a1);
        const d = `M60 60L${x0} ${y0}A55 55 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}Z`; a0 = a1;
        return <path key={n} d={d} fill={COL[i % 10]} />; })}
      <circle cx="60" cy="60" r="26" fill="var(--card)" />
    </svg>
    <div style={{ fontSize: 13 }}>{items.map(([n, v], i) => <div key={n}><span style={{ color: COL[i % 10] }}>●</span> {n} {Math.round((v / tot) * 100)}%</div>)}</div>
  </div>;
}
function Chart({ labels, series, kind }: { labels: string[]; series: { name: string; color: string; v: number[] }[]; kind: "bar" | "line" }) {
  const W = 320, H = 150, mx = Math.max(1, ...series.flatMap(s => s.v)), n = labels.length;
  const x = (i: number) => 30 + ((W - 40) / n) * (i + 0.5), y = (v: number) => H - 20 - (v / mx) * (H - 35);
  return <svg viewBox={`0 0 ${W} ${H}`} width="100%">
    {[0, 0.5, 1].map(t => <g key={t}><line x1="30" x2={W - 10} y1={y(mx * t)} y2={y(mx * t)} stroke="var(--line)" /><text x="27" y={y(mx * t) + 3} fontSize="8" textAnchor="end" fill="var(--sub)">{Math.round((mx * t) / 1000)}k</text></g>)}
    {labels.map((l, i) => <text key={l} x={x(i)} y={H - 6} fontSize="9" textAnchor="middle" fill="var(--sub)">{l.slice(5).replace(/^0/, "")}月</text>)}
    {kind === "bar" ? series.map((s, k) => s.v.map((v, i) => <rect key={s.name + i} x={x(i) - 11 + k * 11} y={y(v)} width="10" height={H - 20 - y(v)} rx="2" fill={s.color} />))
      : series.map(s => <g key={s.name}><polyline fill="none" stroke={s.color} strokeWidth="2" points={s.v.map((v, i) => x(i) + "," + y(v)).join(" ")} />{s.v.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />)}</g>)}
  </svg>;
}
function CatChip({ name, onRename, onDelete }: { name: string; onRename: (n: string) => void; onDelete: () => void }) {
  const [ed, setEd] = useState(false); const [v, setV] = useState(name);
  if (ed) return <span className="chip"><input style={{ width: 90, padding: 2 }} value={v} onChange={e => setV(e.target.value)} />
    <button onClick={() => { onRename(v.trim()); setEd(false); }}>✓</button></span>;
  return <span className="chip">{name}<button onClick={() => { setV(name); setEd(true); }}>✎</button><button onClick={onDelete}>×</button></span>;
}

export default function App() {
  const [d, setD] = useState<Data>(load);
  const [warn, setWarn] = useState("");
  const [ym, setYm] = useState(ymOf(new Date()));
  const blank = { date: today(), type: "expense" as Type, amount: "", category: "食費", memo: "", pay: PAYS[0] };
  const [f, setF] = useState(blank); const [edit, setEdit] = useState<string | null>(null); const [err, setErr] = useState("");
  const [bk, setBk] = useState(""); const [msg, setMsg] = useState(""); const [conf, setConf] = useState(false);
  const [nc, setNc] = useState(""); const [nt, setNt] = useState<Type>("expense");

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)); setWarn(""); } catch (e) { setWarn("⚠ ブラウザへの保存に失敗しました。下の「バックアップ」でJSONを控えてください。"); } }, [d]);

  const sum = (m: string, t: Type) => d.tx.filter(x => x.date.startsWith(m) && x.type === t).reduce((a, b) => a + b.amount, 0);
  const inc = sum(ym, "income"), exp = sum(ym, "expense"), pInc = sum(shift(ym, -1), "income"), pExp = sum(shift(ym, -1), "expense");
  const list = useMemo(() => d.tx.filter(x => x.date.startsWith(ym)).sort((a, b) => b.date.localeCompare(a.date)), [d, ym]);
  const byCat = useMemo(() => { const m: Record<string, number> = {}; list.filter(x => x.type === "expense").forEach(x => (m[x.category] = (m[x.category] || 0) + x.amount)); return Object.entries(m).sort((a, b) => b[1] - a[1]); }, [list]);
  const months = [-5, -4, -3, -2, -1, 0].map(k => shift(ym, k));
  const diff = (a: number, b: number) => { const x = a - b; return (x >= 0 ? "+" : "-") + "¥" + Math.abs(x).toLocaleString("ja-JP"); };

  const submit = () => {
    const amt = Number(f.amount);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setErr("日付を入力してください");
    if (!Number.isInteger(amt) || amt <= 0) return setErr("金額は1円以上の整数で入力してください");
    const t: Tx = { id: edit || uid(), date: f.date, type: f.type, amount: amt, category: f.category, memo: f.memo, pay: f.pay };
    setD({ ...d, tx: edit ? d.tx.map(x => (x.id === edit ? t : x)) : [...d.tx, t] });
    setYm(f.date.slice(0, 7)); setErr(""); setEdit(null); setF({ ...blank, type: f.type, category: f.category, date: f.date });
  };
  const setType = (t: Type) => setF({ ...f, type: t, category: d.cats[t][0] });
  const addCat = () => { const n = nc.trim(); if (!n || d.cats[nt].includes(n)) return; setD({ ...d, cats: { ...d.cats, [nt]: [...d.cats[nt], n] } }); setNc(""); };
  const renameCat = (t: Type, o: string, n: string) => { if (!n || (n !== o && d.cats[t].includes(n))) return;
    const b = { ...d.budgets }; if (t === "expense" && o in b) { b[n] = b[o]; delete b[o]; }
    setD({ tx: d.tx.map(x => (x.type === t && x.category === o ? { ...x, category: n } : x)), cats: { ...d.cats, [t]: d.cats[t].map(c => (c === o ? n : c)) }, budgets: b }); };
  const delCat = (t: Type, c: string) => { if (d.tx.some(x => x.type === t && x.category === c)) return setMsg(`「${c}」は登録データで使用中のため削除できません`);
    setD({ ...d, cats: { ...d.cats, [t]: d.cats[t].filter(x => x !== c) } }); };
  const restore = () => { try { const o = JSON.parse(bk); if (!valid(o)) throw 0; setD(o); setMsg("復元しました"); } catch (e) { setMsg("JSONの形式が正しくありません。復元していません。"); } };

  const over = d.cats.expense.filter(c => d.budgets[c] > 0 && (byCat.find(x => x[0] === c)?.[1] || 0) > d.budgets[c]).length;
  return <div className="w">
    {warn && <div className="warn">{warn}</div>}
    <div className="row" style={{ marginBottom: 12 }}>
      <h1>📒 マイ家計簿</h1>
      <div className="row"><button className="s" onClick={() => setYm(shift(ym, -1))}>◀</button>
        <input type="month" value={ym} onChange={e => e.target.value && setYm(e.target.value)} />
        <button className="s" onClick={() => setYm(shift(ym, 1))}>▶</button></div>
    </div>

    <div className="g g3">
      <div className="c"><div className="k">{ym.replace("-", "年")}月の収入</div><div className="v in">{yen(inc)}</div><div className="k">前月比 {diff(inc, pInc)}</div></div>
      <div className="c"><div className="k">支出</div><div className="v ex">{yen(exp)}</div><div className="k">前月比 {diff(exp, pExp)}</div></div>
      <div className="c"><div className="k">収支</div><div className="v">{yen(inc - exp)}</div><div className="k">前月 {yen(pInc - pExp)}</div></div>
      <div className="c"><div className="k">支出が最多</div><div className="v" style={{ fontSize: 18 }}>{byCat[0] ? byCat[0][0] : "-"}</div><div className="k">{byCat[0] ? yen(byCat[0][1]) : ""}</div></div>
    </div>

    <div className="g g2" style={{ marginTop: 12 }}>
      <div className="c"><h2>{edit ? "✏ 編集中" : "＋ 登録"}</h2>
        <div className="f">
          <select value={f.type} onChange={e => setType(e.target.value as Type)}><option value="expense">支出</option><option value="income">収入</option></select>
          <input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
          <input type="number" inputMode="numeric" min="1" step="1" placeholder="金額(円)" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
          <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{d.cats[f.type].map(c => <option key={c}>{c}</option>)}</select>
          <select value={f.pay} onChange={e => setF({ ...f, pay: e.target.value })}>{PAYS.map(p => <option key={p}>{p}</option>)}</select>
          <input placeholder="内容・メモ" value={f.memo} onChange={e => setF({ ...f, memo: e.target.value })} />
        </div>
        {err && <p style={{ color: "var(--warnt)", margin: "8px 0 0" }}>{err}</p>}
        <div className="row" style={{ justifyContent: "flex-start", marginTop: 10 }}>
          <button onClick={submit}>{edit ? "更新" : "登録"}</button>
          {edit && <button className="s" onClick={() => { setEdit(null); setF(blank); }}>キャンセル</button>}</div>
      </div>
      <div className="c"><h2>カテゴリ別支出</h2><Pie items={byCat} /></div>
      <div className="c"><h2>月別収入・支出 <span className="k"><span className="in">■</span>収入 <span className="ex">■</span>支出</span></h2>
        <Chart kind="bar" labels={months} series={[{ name: "収入", color: "var(--inc)", v: months.map(m => sum(m, "income")) }, { name: "支出", color: "var(--exp)", v: months.map(m => sum(m, "expense")) }]} /></div>
      <div className="c"><h2>支出の推移</h2>
        <Chart kind="line" labels={months} series={[{ name: "支出", color: "var(--pri)", v: months.map(m => sum(m, "expense")) }]} /></div>
    </div>

    <div className="c" style={{ marginTop: 12 }}><h2>登録一覧({list.length}件)</h2>
      <table><thead><tr><th>日付</th><th>区分</th><th>カテゴリ</th><th>内容</th><th>支払い</th><th>金額</th><th></th></tr></thead><tbody>
        {list.map(x => <tr key={x.id}><td>{x.date.slice(5).replace("-", "/")}</td><td className={x.type === "income" ? "in" : "ex"}>{x.type === "income" ? "収入" : "支出"}</td><td>{x.category}</td><td>{x.memo}</td><td>{x.pay}</td>
          <td><b>{yen(x.amount)}</b></td>
          <td><button className="s" onClick={() => { setEdit(x.id); setF({ date: x.date, type: x.type, amount: String(x.amount), category: x.category, memo: x.memo, pay: x.pay }); window.scrollTo(0, 0); }}>編集</button>{" "}
            <button className="d" onClick={() => setD({ ...d, tx: d.tx.filter(t => t.id !== x.id) })}>削除</button></td></tr>)}
      </tbody></table>
      {!list.length && <p className="k">この月のデータはありません</p>}</div>

    <div className="g g2" style={{ marginTop: 12 }}>
      <div className="c"><h2>予算管理 <span className="k">{over ? `超過 ${over}件` : "すべて予算内 🎉"}</span></h2>
        {d.cats.expense.map(c => { const sp = byCat.find(x => x[0] === c)?.[1] || 0, b = d.budgets[c] || 0, o = b > 0 && sp > b;
          return <div key={c} className={"bud" + (o ? " over" : "")}>
            <div className="row"><b>{c}</b>
              <span style={{ fontSize: 13 }}>予算 <input type="number" min="0" step="1000" style={{ width: 90, padding: 3 }} value={b || ""} placeholder="未設定"
                onChange={e => setD({ ...d, budgets: { ...d.budgets, [c]: Math.max(0, Math.floor(Number(e.target.value) || 0)) } })} /></span></div>
            <div className="bar"><i style={{ width: b ? Math.min(100, (sp / b) * 100) + "%" : "0" }} /></div>
            <div className="k" style={{ color: "inherit" }}>使用 {yen(sp)} / {b ? (o ? `${yen(sp - b)} 超過` : `残り ${yen(b - sp)}`) : "予算未設定"}</div></div>; })}
      </div>
      <div className="c"><h2>カテゴリ編集</h2>
        <div className="k">支出</div>{d.cats.expense.map(c => <CatChip key={c} name={c} onRename={n => renameCat("expense", c, n)} onDelete={() => delCat("expense", c)} />)}
        <div className="k" style={{ marginTop: 8 }}>収入</div>{d.cats.income.map(c => <CatChip key={c} name={c} onRename={n => renameCat("income", c, n)} onDelete={() => delCat("income", c)} />)}
        <div className="row" style={{ justifyContent: "flex-start", marginTop: 10 }}>
          <select value={nt} onChange={e => setNt(e.target.value as Type)}><option value="expense">支出</option><option value="income">収入</option></select>
          <input placeholder="新しいカテゴリ" value={nc} onChange={e => setNc(e.target.value)} style={{ width: 130 }} /><button onClick={addCat}>追加</button></div>
        <h2 style={{ marginTop: 18 }}>バックアップ・復元(JSON)</h2>
        <p className="k" style={{ margin: "0 0 6px" }}>データはこの端末のブラウザ内にのみ保存され、外部へ送信されません。消える可能性があるため、定期的にJSONを控えてください。</p>
        <textarea rows={4} style={{ width: "100%" }} value={bk} onChange={e => setBk(e.target.value)} placeholder="ここにJSONが表示されます。復元時はJSONを貼り付けてください" />
        <div className="row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
          <button onClick={() => { setBk(JSON.stringify(d, null, 1)); setMsg("JSONを作成しました。全選択してコピー・保存してください"); }}>バックアップ作成</button>
          <button className="s" onClick={restore}>貼り付けから復元</button>
          <button className="d" onClick={() => setConf(true)}>全データ削除</button></div>
        {msg && <p className="k">{msg}</p>}
      </div>
    </div>
    {conf && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", padding: 16 }}>
      <div className="c" style={{ maxWidth: 340 }}><h2>全データを削除しますか?</h2><p className="k">登録・予算・カテゴリがすべて消え、元に戻せません。先にバックアップを作成してください。</p>
        <div className="row" style={{ justifyContent: "flex-end" }}><button className="s" onClick={() => setConf(false)}>キャンセル</button>
          <button className="d" onClick={() => { setD({ tx: [], cats: sample().cats, budgets: {} }); setConf(false); setMsg("削除しました"); }}>削除する</button></div></div></div>}
  </div>;
}
