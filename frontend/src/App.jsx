import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function App() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔄 завантаження нотаток
  async function loadNotes() {
    const res = await fetch(`${API_URL}/api/notes`);
    const data = await res.json();
    setNotes(data);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  // 💾 збереження нотатки
  async function saveNote() {
    if (!title || !body) return alert("Title and text required");

    setLoading(true);
    let fileUrl = null;

    // ⬆️ upload файлу (якщо є)
    if (file) {
      const fd = new FormData();
      fd.append("file", file);

      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: fd
      });
      const uploadData = await uploadRes.json();
      fileUrl = uploadData.url;
    }

    await fetch(`${API_URL}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, fileUrl })
    });

    setTitle("");
    setBody("");
    setFile(null);
    setLoading(false);
    loadNotes();
  }

  // ☁️ експорт у Google Drive
  async function exportToDrive() {
    await fetch(`${API_URL}/api/export`);
    alert("Exported to Google Drive");
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Cloud Notes</h1>

      {/* 🔲 дві колонки */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 24,
          alignItems: "flex-start"
        }}
      >
        {/* 🟦 ЛІВО — ФОРМА */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16
          }}
        >
          <h2>Create note</h2>

          <input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <textarea
            placeholder="Text"
            rows={5}
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ marginBottom: 10 }}
          />

          <button onClick={saveNote} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>

          <hr style={{ margin: "16px 0" }} />

          <button onClick={exportToDrive}>
            Export to Google Drive
          </button>
        </div>

        {/* 🟨 ПРАВО — НОТАТКИ */}
        <div>
          <h2>Notes</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {notes.map(n => {
              const dt = n.createdAt?.$date ?? n.createdAt;
              const dateLabel = dt ? new Date(dt).toLocaleString() : "";

              return (
                <div
                  key={n._id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <b>{n.title}</b>
                  <div style={{ margin: "6px 0" }}>{n.body}</div>

                  {n.fileUrl && (
                    <div>
                      <a href={n.fileUrl} target="_blank" rel="noreferrer">
                        File
                      </a>
                    </div>
                  )}

                  <small>{dateLabel}</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
