"use client";

import { useState, useEffect } from "react";

type Op = "+" | "-" | "×" | "÷" | null;

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("calcHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (entry: string) => {
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("calcHistory", JSON.stringify(updated));
  };

  const inputNum = (n: string) => {
    if (fresh) {
      setDisplay(n);
      setFresh(false);
    } else {
      setDisplay(display === "0" ? n : display + n);
    }
  };

  const inputOp = (operation: Op) => {
    setPrev(parseFloat(display));
    setOp(operation);
    setFresh(true);
  };

  const calculate = () => {
    if (op === null || prev === null) return;
    const curr = parseFloat(display);
    let res = 0;
    switch (op) {
      case "+": res = prev + curr; break;
      case "-": res = prev - curr; break;
      case "×": res = prev * curr; break;
      case "÷": res = curr !== 0 ? prev / curr : 0; break;
    }
    const entry = `${prev} ${op} ${curr} = ${res}`;
    saveHistory(entry);
    setDisplay(String(Number(res.toFixed(4))));
    setOp(null);
    setPrev(null);
    setFresh(true);
  };

  const clear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const convert = (type: "cm-m" | "m-cm" | "cm-inch" | "inch-cm") => {
    const val = parseFloat(display);
    if (isNaN(val)) return;
    let res = 0;
    let label = "";
    switch (type) {
      case "cm-m": res = val / 100; label = `${val} سم = ${res} متر`; break;
      case "m-cm": res = val * 100; label = `${val} متر = ${res} سم`; break;
      case "cm-inch": res = val / 2.54; label = `${val} سم = ${res.toFixed(2)} إنش`; break;
      case "inch-cm": res = val * 2.54; label = `${val} إنش = ${res.toFixed(2)} سم`; break;
    }
    saveHistory(label);
    setDisplay(String(Number(res.toFixed(4))));
    setFresh(true);
  };

  const btns = [
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "-"],
    ["0", ".", "=", "+"],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#1B5E3B] text-white p-4 flex justify-between items-center">
          <h3 className="font-bold">🧮 آلة حاسبة</h3>
          <button onClick={onClose} className="text-xl hover:text-[#C9A84C]">✕</button>
        </div>

        <div className="p-4 bg-[#F5F0E8]">
          <div className="bg-white p-4 rounded-xl text-right text-2xl font-bold text-[#1B5E3B] min-h-[3rem]">
            {display}
          </div>
          {op && <div className="text-xs text-[#6B7B6E] mt-1 text-right">{prev} {op}</div>}
        </div>

        <div className="p-4 grid grid-cols-4 gap-2">
          {btns.flat().map((b) => (
            <button
              key={b}
              onClick={() => {
                if (["+", "-", "×", "÷"].includes(b)) inputOp(b as Op);
                else if (b === "=") calculate();
                else if (b === ".") inputNum(".");
                else inputNum(b);
              }}
              className={`py-3 rounded-xl font-bold text-lg transition ${
                ["+", "-", "×", "÷", "="].includes(b)
                  ? "bg-[#1B5E3B] text-white hover:bg-[#C9A84C]"
                  : "bg-[#F5F0E8] text-[#1B5E3B] hover:bg-[#E8E4DC]"
              }`}
            >
              {b}
            </button>
          ))}
          <button onClick={clear} className="col-span-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200">
            مسح
          </button>
        </div>

        <div className="px-4 pb-2">
          <p className="text-xs font-bold text-[#6B7B6E] mb-2">تحويل الوحدات:</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => convert("cm-m")} className="py-2 bg-[#C9A84C]/20 text-[#1B5E3B] rounded-lg text-xs font-bold">سم ← متر</button>
            <button onClick={() => convert("m-cm")} className="py-2 bg-[#C9A84C]/20 text-[#1B5E3B] rounded-lg text-xs font-bold">متر ← سم</button>
            <button onClick={() => convert("cm-inch")} className="py-2 bg-[#C9A84C]/20 text-[#1B5E3B] rounded-lg text-xs font-bold">سم ← إنش</button>
            <button onClick={() => convert("inch-cm")} className="py-2 bg-[#C9A84C]/20 text-[#1B5E3B] rounded-lg text-xs font-bold">إنش ← سم</button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-2 text-sm text-[#6B7B6E] hover:text-[#1B5E3B] border-t border-[#E8E4DC] pt-2"
          >
            {showHistory ? "إخفاء السجل" : "عرض السجل"} ({history.length})
          </button>
          {showHistory && (
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {history.length === 0 && <p className="text-xs text-[#6B7B6E] text-center">لا يوجد سجل</p>}
              {history.map((h, i) => (
                <div key={i} className="text-xs bg-[#F5F0E8] p-2 rounded-lg text-[#1B5E3B]">{h}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}