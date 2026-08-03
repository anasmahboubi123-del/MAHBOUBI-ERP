"use client";

import { useState, useEffect } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export default function BlockNote({ onClose }: { onClose: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("tailorNotes");
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem("tailorNotes", JSON.stringify(updated));
  };

  const saveCurrent = () => {
    if (!title.trim()) return;
    if (activeNote) {
      const updated = notes.map((n) =>
        n.id === activeNote.id ? { ...n, title, content, date: new Date().toLocaleString("ar-MA") } : n
      );
      saveNotes(updated);
      setActiveNote(null);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title,
        content,
        date: new Date().toLocaleString("ar-MA"),
      };
      saveNotes([newNote, ...notes]);
    }
    setTitle("");
    setContent("");
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
    if (activeNote?.id === id) {
      setActiveNote(null);
      setTitle("");
      setContent("");
    }
  };

  const filtered = notes.filter((n) => n.title.includes(search) || n.content.includes(search));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden">
        <div className="bg-[#C9A84C] text-[#1B5E3B] p-4 flex justify-between items-center">
          <h3 className="font-bold">📝 ملاحظاتي</h3>
          <button onClick={onClose} className="text-xl hover:text-white">✕</button>
        </div>

        <div className="p-4 border-b border-[#E8E4DC]">
          <input
            type="text"
            placeholder="بحث في الملاحظات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 rounded-lg border border-[#E8E4DC] bg-[#F5F0E8] text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                setActiveNote(note);
                setTitle(note.title);
                setContent(note.content);
              }}
              className="bg-[#F5F0E8] p-3 rounded-xl cursor-pointer hover:bg-[#E8E4DC] transition"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-[#1B5E3B] text-sm">{note.title}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  حذف
                </button>
              </div>
              <p className="text-xs text-[#6B7B6E] mt-1 line-clamp-2">{note.content}</p>
              <span className="text-[10px] text-gray-400 mt-1 block">{note.date}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-[#6B7B6E] text-sm py-8">لا توجد ملاحظات</p>}
        </div>

        <div className="p-4 border-t border-[#E8E4DC] bg-[#F5F0E8]">
          <input
            type="text"
            placeholder="عنوان الملاحظة..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded-lg border border-[#E8E4DC] bg-white text-sm mb-2"
          />
          <textarea
            placeholder="اكتب ملاحظتك هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full p-2 rounded-lg border border-[#E8E4DC] bg-white text-sm resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveCurrent}
              className="flex-1 py-2 bg-[#1B5E3B] text-white rounded-xl font-bold text-sm hover:bg-[#C9A84C] transition"
            >
              {activeNote ? "تحديث" : "حفظ"}
            </button>
            {activeNote && (
              <button
                onClick={() => {
                  setActiveNote(null);
                  setTitle("");
                  setContent("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-bold"
              >
                جديد
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}