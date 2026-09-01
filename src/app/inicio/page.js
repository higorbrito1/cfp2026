"use client";

import { useEffect, useState } from "react";

const seed = {
  assets: [{ id: "palio", name: "Palio", value: 27322 }, { id: "biz", name: "Biz", value: 9904 }],
  debts: [{ id: "consignado", name: "Consignado BB", value: 21494 }],
  months: {
    "2026-09": { income: 2742.88, expenses: { "Cartão MP": 140.94, "Cartão Itaú": 227.57, "Formatura PMPR": 250, "Plano Celular": 45, "Licenciamento Carro": 251.27, Aluguel: 1400, Água: 200, Luz: 150, "Internet (10)": 26.68 } },
    "2026-10": { income: 3251.74, expenses: { "Cartão MP": 140.77, "Cartão Itaú": 23.09, "Empréstimo BB": 803, "Formatura PMPR": 250, "Plano Celular": 45, "Licenciamento Moto": 94.61, Aluguel: 1400, Água: 200, Luz: 150, "Internet (10)": 90 } },
    "2026-11": { income: 3251.74, expenses: { "Cartão MP": 140.77, "Empréstimo BB": 803, "Formatura PMPR": 250, "Plano Celular": 45, Aluguel: 1400, Água: 200, Luz: 150, "Internet (10)": 90 } },
    "2026-12": { income: 3251.74, expenses: { "Cartão MP": 55.54, "Empréstimo BB": 803, "Formatura PMPR": 250, "Plano Celular": 45, Aluguel: 1400, Água: 200, Luz: 150, "Internet (10)": 90 } },
    "2027-01": { income: 3251.74, expenses: { "Cartão MP": 55.54, "Empréstimo BB": 803, "Formatura PMPR": 250, "Plano Celular": 45, Aluguel: 1400, Água: 200, Luz: 150, "Internet (10)": 90 } }
  }
};

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const monthLabel = (key) => new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(new Date(`${key}-01T12:00:00`)).replace(" de ", "/");
function Card({ label, value, tone = "" }) { return <article className={`metric-card ${tone}`}><span>{label}</span><strong>{money(value)}</strong></article>; }

export default function InicioPage() {
  const [data, setData] = useState(seed);
  const [month, setMonth] = useState("2026-09");
  const [tab, setTab] = useState("visao");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", name: "", value: "" });
  useEffect(() => { const saved = window.localStorage.getItem("cfp-finance-data"); if (saved) setData(JSON.parse(saved)); }, []);
  useEffect(() => { window.localStorage.setItem("cfp-finance-data", JSON.stringify(data)); }, [data]);

  const current = data.months[month] || { income: 0, expenses: {} };
  const totalExpenses = Object.values(current.expenses).reduce((sum, value) => sum + value, 0);
  const gross = data.assets.reduce((sum, item) => sum + item.value, 0);
  const debt = data.debts.reduce((sum, item) => sum + item.value, 0);
  const net = gross - debt;
  const months = Object.keys(data.months).sort();
  const monthIndex = months.indexOf(month);
  const balance = current.income - totalExpenses;
  const topExpenses = Object.entries(current.expenses).sort((a, b) => b[1] - a[1]).slice(0, 5);

  function addEntry(event) {
    event.preventDefault();
    const value = Number(form.value.replace(",", "."));
    if (!form.name.trim() || !value) return;
    setData((old) => ({ ...old, months: { ...old.months, [month]: { ...current, income: form.type === "income" ? current.income + value : current.income, expenses: form.type === "expense" ? { ...current.expenses, [form.name.trim()]: (current.expenses[form.name.trim()] || 0) + value } : current.expenses } } }));
    setForm({ type: "expense", name: "", value: "" }); setShowForm(false);
  }

  return <main className="finance-app">
    <header className="app-header"><div><p className="eyebrow">CONTROLE FINANCEIRO</p><h1>Meu dinheiro</h1></div><button className="add-button" onClick={() => setShowForm(true)}>+ Lançamento</button></header>
    <nav className="tabs" aria-label="Navegação principal">{[["visao", "Visão geral"], ["fluxo", "Fluxo mensal"], ["patrimonio", "Patrimônio"]].map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
    <section className="month-bar"><button onClick={() => setMonth(months[Math.max(0, monthIndex - 1)])}>‹</button><strong>{monthLabel(month)}</strong><button onClick={() => setMonth(months[Math.min(months.length - 1, monthIndex + 1)])}>›</button></section>
    {tab === "visao" && <><section className="metrics"><Card label="Saldo do mês" value={balance} tone={balance >= 0 ? "positive" : "negative"} /><Card label="Receitas" value={current.income} /><Card label="Despesas" value={totalExpenses} tone="negative" /><Card label="Patrimônio líquido" value={net} tone="accent" /></section><section className="content-grid"><article className="panel balance-panel"><div className="panel-heading"><div><p className="eyebrow">PROJEÇÃO</p><h2>Seu saldo está positivo</h2></div><span className="balance-pill">{balance >= 0 ? "Saudável" : "Atenção"}</span></div><div className="balance-amount">{money(balance)}</div><p className="muted">Margem de {current.income ? ((balance / current.income) * 100).toFixed(1) : 0}% sobre a receita de {monthLabel(month)}.</p><div className="progress"><span style={{ width: `${Math.min(100, Math.max(0, (totalExpenses / (current.income || 1)) * 100))}%` }} /></div><div className="legend"><span>Despesas <b>{money(totalExpenses)}</b></span><span>Disponível <b>{money(balance)}</b></span></div></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">MAIORES GASTOS</p><h2>Onde seu dinheiro vai</h2></div></div><div className="expense-list">{topExpenses.map(([name, value]) => <div className="expense-row" key={name}><div><span>{name}</span><i><em style={{ width: `${(value / (topExpenses[0]?.[1] || 1)) * 100}%` }} /></i></div><strong>{money(value)}</strong></div>)}</div></article></section><section className="panel history"><div className="panel-heading"><div><p className="eyebrow">EVOLUÇÃO</p><h2>Saldo mensal</h2></div><span className="muted">Acumulado: {money(months.reduce((sum, key) => sum + data.months[key].income - Object.values(data.months[key].expenses).reduce((a, b) => a + b, 0), 0))}</span></div><div className="bars">{months.map((key) => { const value = data.months[key].income - Object.values(data.months[key].expenses).reduce((a, b) => a + b, 0); return <button key={key} onClick={() => setMonth(key)} className={key === month ? "selected" : ""}><span style={{ height: `${Math.max(8, (value / 300) * 100)}%` }} /><small>{monthLabel(key).split("/")[0]}</small><b>{money(value)}</b></button>; })}</div></section></>}
    {tab === "fluxo" && <section className="panel flow-panel"><div className="panel-heading"><div><p className="eyebrow">LANÇAMENTOS</p><h2>Fluxo de {monthLabel(month)}</h2></div><button className="text-button" onClick={() => setShowForm(true)}>Adicionar</button></div><div className="flow-line income-line"><span>Receitas</span><strong>{money(current.income)}</strong></div>{Object.entries(current.expenses).map(([name, value]) => <div className="flow-line" key={name}><span>{name}</span><strong>- {money(value)}</strong></div>)}<div className="flow-total"><span>Saldo mensal</span><strong>{money(balance)}</strong></div></section>}
    {tab === "patrimonio" && <section className="content-grid"><article className="panel"><p className="eyebrow">ATIVOS</p><h2>Patrimônio bruto</h2><div className="big-total">{money(gross)}</div>{data.assets.map((item) => <div className="flow-line" key={item.id}><span>{item.name}</span><strong>{money(item.value)}</strong></div>)}</article><article className="panel"><p className="eyebrow">PASSIVOS</p><h2>Dívidas</h2><div className="big-total negative-text">{money(debt)}</div>{data.debts.map((item) => <div className="flow-line" key={item.id}><span>{item.name}</span><strong>{money(item.value)}</strong></div>)}<div className="flow-total"><span>Patrimônio líquido</span><strong>{money(net)}</strong></div></article></section>}
    {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><form className="modal" onSubmit={addEntry} onClick={(event) => event.stopPropagation()}><button type="button" className="close" onClick={() => setShowForm(false)}>×</button><p className="eyebrow">NOVO LANÇAMENTO</p><h2>Adicionar ao mês</h2><label>Tipo<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="expense">Despesa</option><option value="income">Receita</option></select></label><label>Descrição<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Mercado" autoFocus /></label><label>Valor<input inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0,00" /></label><button className="save-button" type="submit">Salvar lançamento</button></form></div>}
  </main>;
}
