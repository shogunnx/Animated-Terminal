import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Shield, Zap, FileText } from 'lucide-react';
import TerminalWindow from '../../components/TerminalWindow';
import charactersData from '../../data/characters.json';
import { nexusClient } from '../../services/nexusClient';

export default function CharacterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [nexusStatus, setNexusStatus] = useState(null);

  useEffect(() => {
    console.log("CharacterPage mounted with ID:", id);
    if (id && charactersData[id]) {
      setCharacter(charactersData[id]);
      // Fetch live status from Nexus
      nexusClient.getCharacterStatus(id).then(data => {
        if (data) setNexusStatus(data);
      });
    } else {
      console.warn("Character ID not found:", id);
      // Redirect to default if not found, but allow a small delay to avoid loops if something is weird
      // navigate('/characters/victoria_black');
      // Instead of redirecting immediately, let's show an error state
    }
  }, [id]);

  if (!id || !charactersData[id]) {
    return (
      <div className="p-8 text-red-500 font-mono">
        <h1 className="text-2xl font-bold">ERROR: CHARACTER_NOT_FOUND</h1>
        <p>ID: {id}</p>
        <p>The requested file does not exist in the archive.</p>
      </div>
    );
  }

  if (!character) return <div className="p-8 text-primary font-mono animate-pulse">LOADING_ARCHIVE_DATA...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-primary/30 pb-4">
        <div>
          <h1 className="text-4xl font-bold text-primary uppercase tracking-tighter glitch-text" data-text={character.name}>
            {character.name}
          </h1>
          <p className="text-muted-foreground font-mono mt-1">ID: {character.id.toUpperCase()}</p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-xs text-primary/60 uppercase">Clearance Level</div>
          <div className="text-xl font-bold text-primary">OMEGA</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Image Placeholder */}
        <div className="space-y-6">
          <div className="aspect-[3/4] bg-primary/5 border border-primary/30 rounded-sm relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center text-primary/20">
              <User className="w-32 h-32" />
            </div>
            {/* Holographic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full p-4 bg-black/60 backdrop-blur-sm border-t border-primary/20">
              <div className="flex justify-between text-xs font-mono">
                <span>STATUS</span>
                <span className="text-green-400">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-sm space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-muted-foreground">Height</span>
              <span className="text-primary">{character.height}</span>
            </div>
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-muted-foreground">Eyes</span>
              <span className="text-primary">{character.eyes}</span>
            </div>
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-muted-foreground">Skin Tone</span>
              <span className="text-primary">{character.skinTone}</span>
            </div>
          </div>
        </div>

        {/* Middle/Right Column: Lore & Terminal */}
        <div className="lg:col-span-2 space-y-6">
          <TerminalWindow title={`FILE: ${character.id.toUpperCase()}_LORE`}>
            <div className="prose prose-invert prose-p:text-primary/80 prose-headings:text-primary max-w-none">
              <h3 className="flex items-center gap-2 text-lg font-bold uppercase">
                <FileText className="w-5 h-5" /> Executive Summary
              </h3>
              <p>{character.summary}</p>
              
              <h3 className="flex items-center gap-2 text-lg font-bold uppercase mt-6">
                <Database className="w-5 h-5" /> Historical Records
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {character.lore.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h3 className="flex items-center gap-2 text-lg font-bold uppercase mt-6">
                <Zap className="w-5 h-5" /> Known Abilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {character.abilities?.map((ability, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/20 border border-primary/40 rounded text-xs uppercase">
                    {ability}
                  </span>
                ))}
              </div>
            </div>
          </TerminalWindow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/40 border border-primary/30 p-4 rounded-sm">
              <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Active Missions
              </h4>
              <ul className="space-y-2">
                {character.missions.map((mission, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                    {mission}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-black/40 border border-primary/30 p-4 rounded-sm">
              <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Nexus Live Feed
              </h4>
              {nexusStatus ? (
                <div className="text-sm text-green-400">
                  <p>Mood: {nexusStatus.mood || 'Stable'}</p>
                  <p>Energy: {nexusStatus.energy || '100%'}</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Connecting to Nexus Bridge...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
