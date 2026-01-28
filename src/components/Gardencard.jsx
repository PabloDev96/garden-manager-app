import React from 'react';
import { IoGridOutline, IoResizeOutline, IoCalendarOutline } from 'react-icons/io5';
import useCellSize from '../utils/calculateCellSize';

const GardenCard = ({ garden, onClick }) => {
  const totalPlots = garden.grid.rows * garden.grid.columns;
  const filledPlots = garden.plants.flat().filter(plant => plant !== null).length;
  const fillPercentage = ((filledPlots / totalPlots) * 100).toFixed(0);

  const previewRows = Math.min(garden.grid.rows, 8);
  const previewCols = Math.min(garden.grid.columns, 8);

  // gap-1 en Tailwind suele ser 4px
  const gapPx = 4;

  // Tamaño preferido común (ajústalo si quieres)
  const { ref: gridRef, cellSize } = useCellSize({
    cols: previewCols,
    gapPx,
    preferred: 56,
    min: 20,
  });

  return (
    <div
      onClick={() => onClick(garden)}
      className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-6 hover:shadow-xl hover:border-[#5B7B7A] transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#5B7B7A] mb-1 group-hover:text-[#A17C6B] transition-colors">
            {garden.name}
          </h3>
          <p className="text-xs text-[#A17C6B]">
            {garden.dimensions.width}m × {garden.dimensions.height}m
          </p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
          <IoGridOutline className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Grid Preview */}
      <div className="bg-[#E0F2E9] rounded-xl p-4 mb-4">
        <div
          ref={gridRef}
          className="grid"
          style={{
            gap: `${gapPx}px`,
            gridTemplateColumns: `repeat(${previewCols}, ${cellSize}px)`,
            justifyContent: 'center',
          }}
        >
          {Array(previewRows).fill(null).map((_, rowIndex) => (
            Array(previewCols).fill(null).map((_, colIndex) => {
              const hasPlant = garden.plants[rowIndex]?.[colIndex] !== null;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`rounded-sm transition-all ${
                    hasPlant
                      ? 'bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B]'
                      : 'bg-white border border-[#CEB5A7]/50'
                  }`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                  }}
                />
              );
            })
          ))}
        </div>

        {(garden.grid.rows > 8 || garden.grid.columns > 8) && (
          <p className="text-xs text-[#A17C6B] text-center mt-2">
            Vista previa (máximo 8×8)
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#E0F2E9] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <IoResizeOutline className="w-4 h-4 text-[#5B7B7A]" />
            <p className="text-xs text-[#A17C6B]">Cuadrícula</p>
          </div>
          <p className="text-lg font-bold text-[#5B7B7A]">
            {garden.grid.columns} × {garden.grid.rows}
          </p>
        </div>
        <div className="bg-[#E0F2E9] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <IoGridOutline className="w-4 h-4 text-[#5B7B7A]" />
            <p className="text-xs text-[#A17C6B]">Parcelas</p>
          </div>
          <p className="text-lg font-bold text-[#5B7B7A]">
            {filledPlots}/{totalPlots}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-[#A17C6B]">Ocupación</p>
          <p className="text-xs font-bold text-[#5B7B7A]">{fillPercentage}%</p>
        </div>
        <div className="h-2 bg-[#E0F2E9] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] transition-all duration-500"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      {/* Created Date */}
      <div className="flex items-center gap-2 text-xs text-[#A17C6B]">
        <IoCalendarOutline className="w-4 h-4" />
        <span>
          Creado {new Date(garden.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
};

export default GardenCard;