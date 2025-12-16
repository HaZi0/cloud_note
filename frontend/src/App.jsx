import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function App() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(`${API}/api/notes`);
    setNotes(await r.json());
  }

  useEffect(() => { load(); }, []);

  async function saveNote() {
    setBusy(true);
    try {
      let fileUrl = null;

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`${API}/api/upload`, { method: "POST", body: fd });
        const upJson = await up.json();
        fileUrl = upJson.url;
      }

      await fetch(`${API}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, fileUrl })
      });

      setTitle(""); setBody(""); setFile(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function exportToDrive() {
    const r = await fetch(`${API}/api/export`);
    alert(JSON.stringify(await r.json(), null, 2));
  }
  
  

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Cloud Notes</h1>

      <div style={{ display: "grid", gap: 10, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea placeholder="Text" rows={4} value={body} onChange={e => setBody(e.target.value)} />
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <div style={{ display: "flex", gap: 10 }}>
          <button disabled={busy} onClick={saveNote}>Save</button>
          <button onClick={exportToDrive}>Export to Google Drive</button>
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Notes</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {notes.map(n => {
          const dt = n.createdAt?.$date ?? n.createdAt;
          const label = dt ? new Date(dt).toLocaleString() : "";

          return (
            <div key={n._id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              <b>{n.title}</b>
              <div>{n.body}</div>
              <small>{label}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
