import React from 'react';

import Egg from './Egg';

interface EggGridProps {
  brokenEggs: number[];
  onEggClick: (id: number) => void;
  eggRewards: { [key: number]: number | string };
  allEggsRevealed?: boolean;
  allowedEggId?: number;
  linkId?: number;
}

const EggGrid: React.FC<EggGridProps> = ({
  brokenEggs,
  onEggClick,
  eggRewards,
  allEggsRevealed = false,
  allowedEggId,
  linkId,
}) => {
  const eggs = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-4 mb-4 mt-2">
      {/* Hàng đầu: 2 quả trứng */}
      <div className="flex justify-center gap-6">
        {eggs.slice(0, 2).map((eggId) => (
          <Egg
            key={eggId}
            id={eggId}
            isBroken={brokenEggs.includes(eggId)}
            onClick={() => onEggClick(eggId)}
            reward={eggRewards[eggId]}
            disabled={linkId ? brokenEggs.length > 0 : false}
          />
        ))}
      </div>
      
      {/* Hàng giữa: 3 quả trứng */}
      <div className="flex justify-center gap-6">
        {eggs.slice(2, 5).map((eggId) => (
          <Egg
            key={eggId}
            id={eggId}
            isBroken={brokenEggs.includes(eggId)}
            onClick={() => onEggClick(eggId)}
            reward={eggRewards[eggId]}
            disabled={linkId ? brokenEggs.length > 0 : false}
          />
        ))}
      </div>
      
      {/* Hàng cuối: 3 quả trứng */}
      <div className="flex justify-center gap-6">
        {eggs.slice(5, 8).map((eggId) => (
          <Egg
            key={eggId}
            id={eggId}
            isBroken={brokenEggs.includes(eggId)}
            onClick={() => onEggClick(eggId)}
            reward={eggRewards[eggId]}
            disabled={linkId ? brokenEggs.length > 0 : false}
          />
        ))}
      </div>
    </div>
  );
};

export default EggGrid;
