import React from 'react';

import goldenEggBrokenImage from '../assets/golden-egg-broken.png';
import goldenEggImage from '../assets/golden-egg.png';

interface EggProps {
  id: number;
  isBroken: boolean;
  onClick: () => void;
  reward?: number | string;
  disabled?: boolean;
}

const Egg: React.FC<EggProps> = ({
  id,
  isBroken,
  onClick,
  reward,
  disabled = false,
}) => {
  const getEggImage = () => {
    return isBroken ? goldenEggBrokenImage : goldenEggImage;
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative w-32 h-40 transition-all duration-300 transform hover:scale-105
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:drop-shadow-lg'}
        `}
      >
        <img
          src={getEggImage()}
          alt={`Golden Egg ${id}${isBroken ? ' (broken)' : ''}`}
          className="w-32 h-40 object-contain"
        />
        {isBroken && reward && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-yellow-600 drop-shadow-sm bg-white/80 px-2 rounded">
              {reward}
            </span>
          </div>
        )}
      </button>
      <span className="text-sm mt-2 text-center">Egg {id}</span>
    </div>
  );
};

export default Egg;
