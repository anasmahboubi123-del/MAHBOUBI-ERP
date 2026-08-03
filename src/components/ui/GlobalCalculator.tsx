'use client';

import { useState } from 'react';
import { Calculator, X, Equal } from 'lucide-react';

export default function GlobalCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleNumber = (num: string) => {
    if (shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      const result = calculate(previousValue, current, operation);
      setPreviousValue(result);
      setDisplay(String(result));
    }
    setOperation(op);
    setShouldResetDisplay(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEqual = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(String(Number(result.toFixed(2))));
      setPreviousValue(null);
      setOperation(null);
      setShouldResetDisplay(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(false);
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const buttons = [
    { label: 'C', onClick: handleClear, className: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { label: '÷', onClick: () => handleOperation('/'), className: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
    { label: '×', onClick: () => handleOperation('*'), className: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
    { label: '-', onClick: () => handleOperation('-'), className: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
    { label: '7', onClick: () => handleNumber('7') },
    { label: '8', onClick: () => handleNumber('8') },
    { label: '9', onClick: () => handleNumber('9') },
    { label: '+', onClick: () => handleOperation('+'), className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 row-span-2' },
    { label: '4', onClick: () => handleNumber('4') },
    { label: '5', onClick: () => handleNumber('5') },
    { label: '6', onClick: () => handleNumber('6') },
    { label: '1', onClick: () => handleNumber('1') },
    { label: '2', onClick: () => handleNumber('2') },
    { label: '3', onClick: () => handleNumber('3') },
    { label: '=', onClick: handleEqual, className: 'bg-emerald-500 text-white hover:bg-emerald-600 row-span-2' },
    { label: '0', onClick: () => handleNumber('0'), className: 'col-span-2' },
    { label: '.', onClick: handleDecimal },
  ];

  return (
    <>
      {/* زر التبديل العائم */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-xl
          transition-all duration-300 hover:scale-110 active:scale-95
          ${isOpen 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-amber-600 text-white hover:bg-amber-700'
          }
        `}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Calculator className="w-6 h-6" />}
      </button>

      {/* نافذة الآلة الحاسبة */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-amber-900 p-4">
            <div className="text-right text-white text-3xl font-mono font-bold truncate">
              {display}
            </div>
            {operation && (
              <div className="text-right text-amber-300 text-sm mt-1">
                {previousValue} {operation}
              </div>
            )}
          </div>
          <div className="p-3 grid grid-cols-4 gap-2">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                className={`
                  p-3 rounded-lg font-bold text-lg transition-all
                  active:scale-95 hover:shadow-md
                  ${btn.className || 'bg-gray-50 text-gray-800 hover:bg-gray-100'}
                  ${btn.className?.includes('col-span') ? 'col-span-2' : ''}
                  ${btn.className?.includes('row-span') ? 'row-span-2' : ''}
                `}
              >
                {btn.label === '=' ? <Equal className="w-5 h-5 mx-auto" /> : btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}