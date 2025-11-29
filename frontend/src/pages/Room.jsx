import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RoomScene from "../components/RoomScene.jsx";
import { TSV_ROOMS } from "../content/tsvContent.js";

export default function Room() {
  const { id } = useParams();
  const nav = useNavigate();
  const room = useMemo(() => TSV_ROOMS[id], [id]);

  if (!room) {
    return (
      <div className="tsv-glass" style={{ padding: 16 }}>
        <div className="tsv-title">ROOM NOT FOUND</div>
        <div style={{ marginTop: 10, opacity:.75 }}>No room for id: <b>{id}</b></div>
        <button className="tsv-btn" style={{ marginTop: 12 }} onClick={() => nav("/characters")}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10, marginBottom: 12, flexWrap:"wrap" }}>
        <div>
          <div className="tsv-title" style={{ fontSize: 14 }}>{room.title}</div>
          <div style={{ fontSize: 12, opacity:.70, marginTop: 6 }}>{room.vibe}</div>
        </div>
        <div style={{ display:"flex", gap: 10 }}>
          <button className="tsv-btn" onClick={() => nav(`/characters/${id}`)}>Open Profile</button>
          <button className="tsv-btn" onClick={() => nav(`/characters`)}>All Characters</button>
        </div>
      </div>

      <RoomScene room={room} characterId={id} onTalk={() => nav(`/characters/${id}`)} />
    </div>
  );
}