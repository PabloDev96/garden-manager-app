import React from 'react';
import { IoGridOutline, IoResizeOutline, IoCalendarOutline, IoBasketOutline, IoScaleOutline } from 'react-icons/io5';
import { BiArea } from "react-icons/bi";
import useCellSize from '../utils/calculateCellSize';
import { CROPS_DATABASE } from '../utils/cropsDatabase';

const GardenCard = ({ garden, onClick }) => {
  const totalPlots = garden.grid.rows * garden.grid.columns;
  const filledPlots = garden.plants.flat().filter(plant => plant !== null).length;
  const fillPercentage = ((filledPlots / totalPlots) * 100).toFixed(0);
  const totalArea = garden.dimensions.width * garden.dimensions.height;
  const plotWidth = garden.dimensions.width / garden.grid.columns;
  const plotHeight = garden.dimensions.height / garden.grid.rows;
  const plotArea = plotWidth * plotHeight;

  const createdAtDate =
    garden?.createdAt?.toDate?.() ??
    (garden?.createdAt ? new Date(garden.createdAt) : null);

  const previewRows = Math.min(garden.grid.rows, 8);
  const previewCols = Math.min(garden.grid.columns, 8);

  // gap-1 en Tailwind suele ser 4px
  const gapPx = 4;

  const { ref: gridRef, cellSize } = useCellSize({
    cols: previewCols,
    gapPx,
    preferred: 56,
    min: 20,
  });

  // totales recolecciones
  const totalUnits = garden?.totals?.totalUnits ?? 0;
  const totalGrams = garden?.totals?.totalGrams ?? 0;

  return (
    <div
      onClick={() => onClick(garden)}
      className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-6 hover:shadow-xl hover:border-[#5B7B7A] transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="mb-5 text-center">
        <h3 className="text-2xl font-extrabold text-[#5B7B7A] mb-1 group-hover:text-[#A17C6B] transition-colors">
          {garden.name}
        </h3>

        <p className="text-sm text-[#A17C6B] mb-1">
          {garden.dimensions.width}m × {garden.dimensions.height}m
        </p>

        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-[#5B7B7A]">
          <BiArea className="w-4 h-4" />
          <span>{totalArea.toFixed(1)} m²</span>
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
              const plant = garden.plants?.[rowIndex]?.[colIndex] ?? null;
              const hasPlant = plant !== null;

              const plantInfo =
                hasPlant && plant?.category && plant?.type
                  ? CROPS_DATABASE[plant.category]?.types?.[plant.type]
                  : null;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`rounded-sm border transition-all relative overflow-hidden ${hasPlant ? 'border-0' : 'bg-[#CEB5A7] border-[#5B7B7A]'
                    }`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: plantInfo?.color || (hasPlant ? '#5B7B7A' : undefined),
                  }}
                  title={plantInfo?.name || plant?.name || 'Vacío'}
                >
                  {hasPlant && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span style={{ fontSize: Math.min(cellSize * 0.7, 22) }}>
                        {plantInfo?.emoji || plant?.emoji || '🌱'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Superficie por parcela */}
        <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl p-3 flex flex-col items-center justify-center text-center text-white">
          <BiArea className="w-5 h-5 mb-1" />
          <p className="text-xs opacity-90 mb-1">Superificie Parcela</p>
          <p className="text-lg font-bold leading-none">
            {plotArea.toFixed(2)} m²
          </p>
        </div>

        {/* Parcelas ocupadas */}
        <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl p-3 flex flex-col items-center justify-center text-center text-white">
          <IoGridOutline className="w-5 h-5 mb-1" />
          <p className="text-xs opacity-90 mb-1">Parcelas</p>
          <p className="text-lg font-bold leading-none">
            {filledPlots}/{totalPlots}
          </p>
        </div>

        {/* Unidades */}
        <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl p-3 flex flex-col items-center justify-center text-center text-white">
          <IoBasketOutline className="w-5 h-5 mb-1" />
          <p className="text-xs opacity-90 mb-1">Unidades</p>
          <p className="text-lg font-bold leading-none">{totalUnits}</p>
        </div>

        {/* Peso */}
        <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl p-3 flex flex-col items-center justify-center text-center text-white">
          <IoScaleOutline className="w-5 h-5 mb-1" />
          <p className="text-xs opacity-90 mb-1">Peso</p>

          {totalGrams <= 0 ? (
            <p className="text-lg font-bold leading-none">—</p>
          ) : totalGrams < 1000 ? (
            <p className="text-lg font-bold leading-none">
              {Math.round(totalGrams)} g
            </p>
          ) : (
            <p className="text-lg font-bold leading-none">
              {(totalGrams / 1000).toFixed(1)} kg
            </p>
          )}
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
          {createdAtDate
            ? `Creado ${createdAtDate.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}`
            : 'Creado —'}
        </span>
      </div>
    </div>
  );
};

export default GardenCard;