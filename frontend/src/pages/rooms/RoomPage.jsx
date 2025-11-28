import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RoomScene from "../../components/RoomScene";
import { TSV_ROOMS } from "../../content/tsvContent";

export default function RoomPage() {
  const { id } = useParams();       // character id
  const nav = useNavigate();

  const room = useMemo(() => TSV_ROOMS[id], [id]);

  if (!room) {
    return (
      <div className="tsv-bg" style={{ padding: 20 }}>
        <div className="tsv-glass" style={{ padding: 18 }}>
          <div className="tsv-title">ROOM NOT FOUND</div>
          <div style={{ opacity:.75, marginTop: 10 }}>
            No room config for: <b>{id}</b>
          </div>
          <button className="tsv-btn" style={{ marginTop: 12 }} onClick={() => nav("/")}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tsv-bg" style={{ padding: 18 }}>
      <div style={{ maxWidth: 1100, margin:"0 auto" }}>
        <div className="tsv-title" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, opacity:.92 }}>{room.title}</div>
            <div style={{ fontSize: 12, opacity:.70, marginTop: 4 }}>{room.vibe}</div>
          </div>
          <button className="tsv-btn" onClick={() => nav(`/characters/${id}`)}>Open Profile</button>
        </div>

        <RoomScene
          room={room}
          characterId={id}
          onTalk={() => nav(`/characters/${id}?chat=1`)}
        />
      </div>
    </div>
  );
}
