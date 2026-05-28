import React, { useState, useEffect } from 'react';

type Pet = {
  id: number;
  emoji: string;
  type: 'run-right' | 'run-left' | 'peek-bottom' | 'peek-side';
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

const PETS = ['🐱', '🐶', '🐈', '🐕', '🐾'];
const TYPES = ['run-right', 'run-left', 'peek-bottom', 'peek-side'] as const;

export function PetOverlay() {
  const [activePets, setActivePets] = useState<Pet[]>([]);

  useEffect(() => {
    // Only spawn occasionally (every 30 to 60 seconds)
    // To make it fun but not distracting.
    const spawnPet = () => {
      const emoji = PETS[Math.floor(Math.random() * PETS.length)];
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      
      const newPet: Pet = { id: Date.now(), emoji, type };

      // Assign styles conditionally based on type
      if (type === 'run-right') {
        newPet.bottom = `${Math.floor(Math.random() * 80) + 10}%`; // avoid extreme top/bottom
      } else if (type === 'run-left') {
        newPet.bottom = `${Math.floor(Math.random() * 80) + 10}%`;
      } else if (type === 'peek-bottom') {
        newPet.left = `${Math.floor(Math.random() * 80) + 10}%`;
      } else if (type === 'peek-side') {
        newPet.top = `${Math.floor(Math.random() * 80) + 10}%`;
      }

      setActivePets((prev) => [...prev, newPet]);

      // Remove after animation completes
      const duration = type.startsWith('run') ? 10000 : 5000;
      setTimeout(() => {
        setActivePets((prev) => prev.filter((p) => p.id !== newPet.id));
      }, duration);
      
      // Schedule next spawn
      const nextSpawnTime = Math.floor(Math.random() * 30000) + 20000; // 20s to 50s
      timeoutId = setTimeout(spawnPet, nextSpawnTime);
    };

    let timeoutId = setTimeout(spawnPet, Math.floor(Math.random() * 10000) + 5000); // initial spawn

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {activePets.map((pet) => (
        <div
          key={pet.id}
          className={`absolute text-4xl drop-shadow-md animate-pet opacity-80 ${pet.type}`}
          style={{
            top: pet.top,
            bottom: pet.bottom,
            left: pet.left,
            right: pet.right,
          }}
        >
          {pet.emoji}
        </div>
      ))}
    </div>
  );
}
