import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  IoClose,
  IoGridOutline,
  IoTrashOutline,
  IoAddOutline,
  IoArrowBackOutline,
  IoLeafOutline,
  IoWaterOutline,
  IoBasketOutline,
  IoScaleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoListOutline,
} from 'react-icons/io5';
import { GiPlantSeed } from "react-icons/gi";

import HoverTooltip from './HoverTooltip';
import useCellSize from '../utils/calculateCellSize';
import useGridSelection from "../utils/useGridSelection";

import addCropUseCase from '../services/gardens/addCropUseCase';
import removeCropUseCase from '../services/gardens/removeCropUseCase';
import addHarvestUseCase from '../services/gardens/addHarvestUseCase';
import getPlotHarvestsUseCase from '../services/gardens/getPlotHarvestUseCase';
import getGardenTotalsUseCase from '../services/gardens/getGardenTotalUseCase';
import { CROPS_DATABASE } from '../utils/cropsDatabase';
import { notify } from '../utils/notify';
import ConfirmModal from './ConfirmModal';
import { Toaster } from 'sileo';

// ===================== LoadingToast =====================
const LoadingToast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 z-[99999] pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium"
        style={{ background: 'linear-gradient(135deg, #5B7B7A 0%, #4a6968 60%, #A17C6B 100%)', minWidth: '200px' }}>
        <svg className="shrink-0 animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
          <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
};

// ===================== TableView =====================
const TableView = ({ uid, gardenId, garden, onCellClick, onBulkAction, processingBulk, refreshKey, onReady }) => {
  const [allHarvests, setAllHarvests] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [checkedRows, setCheckedRows] = useState(new Set());
  const [newHarvestIds, setNewHarvestIds] = useState(new Set());
  const [mobileTab, setMobileTab] = useState('plots');

  useEffect(() => {
    if (!uid || !gardenId) return;
    const load = async () => {
      setLoading(true);
      try {
        const map = {};
        for (let row = 0; row < garden.grid.rows; row++) {
          for (let col = 0; col < garden.grid.columns; col++) {
            const key = `${row}-${col}`;
            map[key] = await getPlotHarvestsUseCase(uid, gardenId, row, col);
          }
        }
        setAllHarvests(map);
      } catch (e) {
        console.error('Error cargando historiales:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid, gardenId, garden.grid.rows, garden.grid.columns, refreshKey]);

  useEffect(() => {
    if (!onReady) return;
    onReady({
      addHarvest: (row, col, harvestEntry) => {
        const key = `${row}-${col}`;
        setAllHarvests((prev) => ({
          ...prev,
          [key]: [harvestEntry, ...(prev[key] ?? [])],
        }));
        setNewHarvestIds((prev) => new Set([...prev, harvestEntry.id]));
        setTimeout(() => {
          setNewHarvestIds((prev) => {
            const next = new Set(prev);
            next.delete(harvestEntry.id);
            return next;
          });
        }, 1200);
      },
    });
  }, [onReady]);

  const rows = useMemo(() => {
    const result = [];
    for (let r = 0; r < garden.grid.rows; r++) {
      for (let c = 0; c < garden.grid.columns; c++) {
        const plant = garden.plants[r]?.[c] ?? null;
        const key = `${r}-${c}`;
        const harvests = (allHarvests[key] ?? []).slice().sort((a, b) => {
          const da = a.harvestDate?.toDate?.() ?? new Date(0);
          const db = b.harvestDate?.toDate?.() ?? new Date(0);
          return db - da;
        });
        const totalUnits = harvests.reduce((s, h) => s + (h.units || 0), 0);
        const totalGrams = harvests.reduce((s, h) => s + (h.totalGrams || 0), 0);
        const lastHarvest = harvests[0] ?? null;
        result.push({
          r, c, key, plant,
          plantInfo: plant?.category && plant?.type ? CROPS_DATABASE[plant.category]?.types[plant.type] : null,
          harvests, totalUnits, totalGrams, lastHarvest,
        });
      }
    }
    return result;
  }, [garden, allHarvests]);

  const allHarvestsSorted = useMemo(() => {
    const list = [];
    rows.forEach(({ r, c, plant, plantInfo, harvests }) => {
      harvests.forEach((h) => list.push({ ...h, r, c, plant, plantInfo }));
    });
    return list.sort((a, b) => {
      const da = a.harvestDate?.toDate?.() ?? new Date(0);
      const db = b.harvestDate?.toDate?.() ?? new Date(0);
      return db - da;
    });
  }, [rows]);

  const allKeys = useMemo(() => new Set(rows.map((r) => r.key)), [rows]);
  const allChecked = checkedRows.size > 0 && checkedRows.size === allKeys.size;
  const someChecked = checkedRows.size > 0 && !allChecked;

  const toggleAll = () => setCheckedRows(allChecked ? new Set() : new Set(allKeys));
  const toggleCheck = (key, e) => {
    e.stopPropagation();
    setCheckedRows((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleRow = (key) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const clearChecked = () => setCheckedRows(new Set());
  const checkedCells = useMemo(() => { const s = new Set(); checkedRows.forEach((k) => s.add(k)); return s; }, [checkedRows]);

  const fmtGrams = (g) => g < 1000 ? `${Math.round(g)}g` : `${(g / 1000).toFixed(1)}kg`;
  const fmtDate = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
  const fmtDateTime = (d) =>
    d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#5B7B7A] border-t-transparent animate-spin" />
        <p className="text-[#A17C6B] text-sm">Cargando datos de parcelas…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes harvestIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .harvest-new { animation: harvestIn 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
      `}</style>

      {/* Barra bulk */}
      {checkedRows.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-white border-2 border-[#5B7B7A]/30 rounded-2xl px-4 py-3">
          <span className="text-sm font-bold text-[#5B7B7A]">{checkedRows.size} seleccionadas</span>
          <button onClick={() => onBulkAction('plant', checkedCells)} disabled={processingBulk}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
            <GiPlantSeed className="w-4 h-4" />Plantar
          </button>
          <button onClick={() => onBulkAction('delete', checkedCells)} disabled={processingBulk}
            className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-all disabled:opacity-50 cursor-pointer">
            <IoTrashOutline className="w-4 h-4" />Eliminar
          </button>
          <button onClick={clearChecked} className="ml-auto text-xs text-[#A17C6B] hover:text-[#5B7B7A] underline cursor-pointer">Limpiar</button>
        </div>
      )}

      {/* Toggle mobile */}
      {allHarvestsSorted.length > 0 && (
        <div className="flex sm:hidden bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-1 gap-1">
          <button onClick={() => setMobileTab('plots')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer
              ${mobileTab === 'plots' ? 'bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white shadow' : 'text-[#A17C6B] hover:bg-[#E0F2E9]'}`}>
            <IoGridOutline className="w-4 h-4" />Parcelas
          </button>
          <button onClick={() => setMobileTab('harvests')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer
              ${mobileTab === 'harvests' ? 'bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white shadow' : 'text-[#A17C6B] hover:bg-[#E0F2E9]'}`}>
            <IoBasketOutline className="w-4 h-4" />Recolecciones
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${mobileTab === 'harvests' ? 'bg-white/30 text-white' : 'bg-[#5B7B7A]/10 text-[#5B7B7A]'}`}>
              {allHarvestsSorted.length}
            </span>
          </button>
        </div>
      )}

      <div className="flex gap-5 items-start">

        {/* ── TABLA DE PARCELAS ── */}
        <div className={`flex-1 min-w-0 bg-white border-2 border-[#5B7B7A]/50 rounded-3xl overflow-hidden
          ${allHarvestsSorted.length > 0 && mobileTab !== 'plots' ? 'hidden sm:block' : ''}`}>

          {/* ── CABECERA (solo desktop) ── */}
          <div className="hidden sm:grid sm:grid-cols-[32px_44px_1fr_90px_140px_52px_70px_36px] gap-x-1 px-3 py-3 border-b-2 border-[#4a6968]/40 text-xs font-bold text-white uppercase tracking-wide items-center"
            style={{ background: 'linear-gradient(135deg, #5B7B7A 0%, #4a6968 60%, #A17C6B 100%)' }}>
            <div className="flex justify-center">
              <input type="checkbox" checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked; }}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-2 border-white/50 accent-white cursor-pointer" />
            </div>
            <span className="opacity-90">Parc.</span>
            <span className="opacity-90">Cultivo</span>
            <span className="opacity-90">Plantado</span>
            <span className="opacity-90">Última cosecha</span>
            <span className="text-center opacity-90">Ud.</span>
            <span className="text-center opacity-90">Peso</span>
            <span />
          </div>

          {/* ── CABECERA MOBILE: checkbox global + label ── */}
          <div className="flex sm:hidden items-center gap-3 px-4 py-3 border-b-2 border-[#4a6968]/40"
            style={{ background: 'linear-gradient(135deg, #5B7B7A 0%, #4a6968 60%, #A17C6B 100%)' }}>
            <input type="checkbox" checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = someChecked; }}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-2 border-white/50 accent-white cursor-pointer" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              {checkedRows.size > 0 ? `${checkedRows.size} seleccionadas` : `${rows.length} parcelas`}
            </span>
          </div>

          <div className="divide-y divide-[#CEB5A7]/20">
            {rows.map(({ r, c, key, plant, plantInfo, harvests, totalUnits, totalGrams, lastHarvest }) => {
              const isExpanded = expandedRows.has(key);
              const isChecked = checkedRows.has(key);
              const lastDate = lastHarvest?.harvestDate?.toDate?.() ?? null;

              return (
                <div key={key} className={isChecked ? 'bg-[#E0F2E9]/40' : ''}>

                  {/* ── FILA DESKTOP ── */}
                  <div className="hidden sm:grid sm:grid-cols-[32px_44px_1fr_90px_140px_52px_70px_36px] gap-x-1 px-3 py-2.5 items-center transition-colors hover:bg-[#E0F2E9]/30">
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked} onChange={(e) => toggleCheck(key, e)}
                        className="w-4 h-4 rounded border-2 border-[#CEB5A7] accent-[#5B7B7A] cursor-pointer" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#A17C6B]">{r},{c}</span>
                    <div className="flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => onCellClick(r, c)}>
                      {plantInfo ? (
                        <><span className="text-base shrink-0">{plantInfo.emoji}</span><span className="text-xs font-semibold text-[#3D5A59] truncate">{plantInfo.name}</span></>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[#A17C6B] italic hover:text-[#5B7B7A]">
                          <IoAddOutline className="w-3 h-3" />Añadir
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#A17C6B]">{plant?.plantedDate ? fmtDate(new Date(plant.plantedDate)) : '—'}</span>
                    <div>
                      {lastHarvest && lastDate ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#3D5A59] leading-tight">{fmtDate(lastDate)}</span>
                          <span className="text-[10px] text-[#A17C6B]">{lastHarvest.units}ud{lastHarvest.totalGrams > 0 ? ` · ${fmtGrams(lastHarvest.totalGrams)}` : ''}</span>
                        </div>
                      ) : <span className="text-xs text-[#CEB5A7]">—</span>}
                    </div>
                    <div className="text-center">
                      {totalUnits > 0 ? <span className="text-xs font-bold text-[#5B7B7A]">{totalUnits}</span> : <span className="text-xs text-[#CEB5A7]">—</span>}
                    </div>
                    <div className="text-center">
                      {totalGrams > 0 ? <span className="text-xs font-bold text-[#5B7B7A]">{fmtGrams(totalGrams)}</span> : <span className="text-xs text-[#CEB5A7]">—</span>}
                    </div>
                    <div className="flex justify-center">
                      {harvests.length > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); toggleRow(key); }}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#E0F2E9] text-[#5B7B7A] cursor-pointer">
                          {isExpanded ? <IoChevronUpOutline className="w-3.5 h-3.5" /> : <IoChevronDownOutline className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── FILA MOBILE: tarjeta ── */}
                  <div className="flex sm:hidden items-start gap-3 px-4 py-3">
                    {/* Checkbox */}
                    <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked} onChange={(e) => toggleCheck(key, e)}
                        className="w-4 h-4 rounded border-2 border-[#CEB5A7] accent-[#5B7B7A] cursor-pointer" />
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0" onClick={() => onCellClick(r, c)}>
                      {/* Fila superior: emoji + nombre + coordenada */}
                      <div className="flex items-center gap-2 mb-1">
                        {plantInfo ? (
                          <>
                            <span className="text-xl shrink-0">{plantInfo.emoji}</span>
                            <span className="text-sm font-bold text-[#3D5A59] truncate">{plantInfo.name}</span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-[#A17C6B] italic">
                            <IoAddOutline className="w-4 h-4" />Añadir cultivo
                          </span>
                        )}
                        <span className="ml-auto text-[10px] font-mono font-bold text-[#A17C6B] shrink-0 bg-[#E0F2E9] px-1.5 py-0.5 rounded-md">
                          {r},{c}
                        </span>
                      </div>

                      {/* Fila de stats */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {plant?.plantedDate && (
                          <span className="text-[11px] text-[#A17C6B]">
                            🌱 {fmtDate(new Date(plant.plantedDate))}
                          </span>
                        )}
                        {totalUnits > 0 && (
                          <span className="text-[11px] font-semibold text-[#5B7B7A]">
                            <IoBasketOutline className="inline w-3 h-3 mr-0.5" />{totalUnits} ud
                          </span>
                        )}
                        {totalGrams > 0 && (
                          <span className="text-[11px] font-semibold text-[#5B7B7A]">
                            <IoScaleOutline className="inline w-3 h-3 mr-0.5" />{fmtGrams(totalGrams)}
                          </span>
                        )}
                        {lastHarvest && lastDate && (
                          <span className="text-[11px] text-[#A17C6B]">
                            Última: {fmtDate(lastDate)}
                          </span>
                        )}
                        {!plant && !totalUnits && (
                          <span className="text-[11px] text-[#CEB5A7]">Sin datos</span>
                        )}
                      </div>
                    </div>

                    {/* Botón expandir */}
                    {harvests.length > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); toggleRow(key); }}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl bg-[#E0F2E9] text-[#5B7B7A] cursor-pointer mt-0.5">
                        {isExpanded ? <IoChevronUpOutline className="w-4 h-4" /> : <IoChevronDownOutline className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Historial expandido (compartido mobile+desktop) */}
                  {isExpanded && harvests.length > 0 && (
                    <div className="bg-[#E0F2E9]/30 border-t border-[#CEB5A7]/20 px-3 sm:px-4 py-3">
                      <p className="text-xs font-bold text-[#5B7B7A] uppercase tracking-wide mb-2">Historial</p>
                      <div className="space-y-1.5">
                        {harvests.map((h) => {
                          const date = h.harvestDate?.toDate?.() || new Date();
                          return (
                            <div key={h.id}
                              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border border-[#CEB5A7]/30 transition-colors duration-500
                                ${newHarvestIds.has(h.id) ? 'bg-[#E0F2E9] shadow-sm harvest-new' : 'bg-white'}`}>
                              <span className="text-[#A17C6B] text-[11px]">{fmtDateTime(date)}</span>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs font-semibold text-[#3D5A59]">
                                  <IoBasketOutline className="inline w-3 h-3 mr-0.5 text-[#5B7B7A]" />{h.units} ud
                                </span>
                                {h.totalGrams > 0 && (
                                  <span className="text-xs font-semibold text-[#3D5A59]">
                                    <IoScaleOutline className="inline w-3 h-3 mr-0.5 text-[#5B7B7A]" />{fmtGrams(h.totalGrams)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ÚLTIMAS RECOLECCIONES ── */}
        {allHarvestsSorted.length > 0 && (
          <div className={`bg-white border-2 border-[#5B7B7A]/50 rounded-3xl overflow-hidden flex flex-col
            w-full sm:w-72 sm:shrink-0 sm:sticky sm:top-24 sm:max-h-[calc(100vh-8rem)]
            ${mobileTab !== 'harvests' ? 'hidden sm:flex' : 'flex'}`}>
            <div className="px-4 py-3 border-b-2 border-[#4a6968]/40 flex items-center gap-2 shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B7B7A 0%, #4a6968 60%, #A17C6B 100%)' }}>
              <IoBasketOutline className="w-4 h-4 text-white" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Últimas recolecciones</h3>
              <span className="ml-auto text-xs text-white/70 font-medium">{allHarvestsSorted.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#CEB5A7]/20">
              {allHarvestsSorted.map((h, i) => {
                const date = h.harvestDate?.toDate?.() || new Date();
                return (
                  <div key={h.id ?? i}
                    className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-500
                      ${newHarvestIds.has(h.id) ? 'bg-[#E0F2E9] harvest-new' : 'hover:bg-[#E0F2E9]/30'}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#E0F2E9] shrink-0 text-sm">
                      {h.plantInfo?.emoji ?? <IoLeafOutline className="w-3.5 h-3.5 text-[#5B7B7A]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#3D5A59] truncate">
                          {h.plantInfo?.name ?? h.plant?.name ?? 'Cultivo'}
                        </span>
                        <span className="text-[10px] text-[#A17C6B] font-mono shrink-0">{h.r},{h.c}</span>
                      </div>
                      <span className="text-[10px] text-[#A17C6B]">{fmtDateTime(date)}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-[#5B7B7A]">{h.units} ud</span>
                      {h.totalGrams > 0 && <span className="text-[10px] text-[#A17C6B]">{fmtGrams(h.totalGrams)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== GardenView =====================
const GardenView = ({ uid, garden, onClose, onUpdate, onDelete, onTotalsUpdate }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [savingCell, setSavingCell] = useState(false);
  const [gardenTotals, setGardenTotals] = useState({ totalUnits: 0, totalGrams: 0 });
  const [viewMode, setViewMode] = useState('table');
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const tableApiRef = useRef(null);

  const [tableBulkCells, setTableBulkCells] = useState(new Set());
  const [showTablePlantModal, setShowTablePlantModal] = useState(false);
  const [showTableDeleteConfirm, setShowTableDeleteConfirm] = useState(false);
  const [showDeleteGardenConfirm, setShowDeleteGardenConfirm] = useState(false);
  const [deletingGarden, setDeletingGarden] = useState(false);
  const [showPlantAllModal, setShowPlantAllModal] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [processingBulk, setProcessingBulk] = useState(false);
  const [loadingToast, setLoadingToast] = useState(null);

  const gridWrapRef = useRef(null);
  const { selectedCells, isSelecting, overlayStyle, cellRefs, keyOf, handlers, clearSelection, wasDragRef } = useGridSelection({ gridWrapRef });

  const confirmDeleteGarden = async () => {
    try {
      setDeletingGarden(true);
      await onDelete(garden.id);
      setShowDeleteGardenConfirm(false);
      notify.error({ title: 'Huerto eliminado', description: 'Se ha eliminado correctamente' });
    } catch (e) {
      console.error(e);
      notify.error({ title: 'Error', description: 'No se pudo eliminar el huerto' });
    } finally {
      setDeletingGarden(false);
    }
  };

  const handlePlantAll = async (plantData) => {
    if (!uid || !garden) return;
    setLoadingToast('Plantando...');
    try {
      setProcessingBulk(true);
      let plantedCount = 0;
      for (let row = 0; row < garden.grid.rows; row++) {
        for (let col = 0; col < garden.grid.columns; col++) {
          if (!garden.plants[row]?.[col]) {
            const plantId = `${Date.now()}_${row}_${col}_${Math.random().toString(16).slice(2)}`;
            await addCropUseCase(uid, garden.id, row, col, { ...plantData, id: plantId });
            plantedCount++;
          }
        }
      }
      setShowPlantAllModal(false);
      setLoadingToast(null);
      notify.success({ title: 'Plantación completada', description: `${plantData?.emoji || ''} ${plantData?.name || 'Cultivo'} · ${plantedCount} parcelas` });
    } catch (e) {
      console.error(e);
      setLoadingToast(null);
      notify.error({ title: 'Error', description: 'No se pudo completar la plantación' });
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleDeleteAll = async (deleteHistory = false) => {
    if (!uid || !garden) return;
    setLoadingToast('Eliminando cultivos...');
    try {
      setProcessingBulk(true);
      let deletedCount = 0, totalRemovedUnits = 0, totalRemovedGrams = 0;
      for (let row = 0; row < garden.grid.rows; row++) {
        for (let col = 0; col < garden.grid.columns; col++) {
          if (garden.plants[row]?.[col]) {
            const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(uid, garden.id, row, col, { deleteHistory });
            totalRemovedUnits += removedUnits; totalRemovedGrams += removedGrams; deletedCount++;
          }
        }
      }
      if (deleteHistory) setGardenTotals((prev) => ({ totalUnits: Math.max(0, prev.totalUnits - totalRemovedUnits), totalGrams: Math.max(0, prev.totalGrams - totalRemovedGrams) }));
      setShowDeleteAllConfirm(false);
      clearSelection();
      await onUpdate();
      setLoadingToast(null);
      notify.error({ title: 'Eliminación completada', description: `${deletedCount} cultivos eliminados` });
    } catch (e) {
      console.error(e);
      setLoadingToast(null);
      notify.error({ title: 'Error', description: 'No se pudo completar la eliminación' });
    } finally {
      setProcessingBulk(false);
    }
  };

  const [showPlantSelectedModal, setShowPlantSelectedModal] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingPlantData, setPendingPlantData] = useState(null);
  const [overwriteStats, setOverwriteStats] = useState({ occupied: 0, empty: 0 });

  const handlePlantSelected = async (plantData) => {
    if (!uid || !garden || selectedCells.size === 0) return;
    let emptyCount = 0, occupiedCount = 0;
    for (const cellKey of selectedCells) {
      const [r, c] = cellKey.split('-');
      garden.plants[parseInt(r)]?.[parseInt(c)] ? occupiedCount++ : emptyCount++;
    }
    if (occupiedCount > 0) {
      setPendingPlantData(plantData);
      setOverwriteStats({ occupied: occupiedCount, empty: emptyCount });
      setShowPlantSelectedModal(false);
      setShowOverwriteConfirm(true);
      return;
    }
    await executePlantSelected(plantData, false);
  };

  const executePlantSelected = async (plantData, deleteHistory = false) => {
    if (!uid || !garden || selectedCells.size === 0) return;
    setLoadingToast('Plantando cultivos...');
    try {
      setProcessingBulk(true);
      let plantedCount = 0, overwrittenCount = 0, totalRemovedUnits = 0, totalRemovedGrams = 0;
      for (const cellKey of selectedCells) {
        const [rowStr, colStr] = cellKey.split('-');
        const row = parseInt(rowStr), col = parseInt(colStr);
        const currentPlant = garden.plants[row]?.[col];
        if (currentPlant) {
          const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(uid, garden.id, row, col, { deleteHistory });
          totalRemovedUnits += removedUnits; totalRemovedGrams += removedGrams;
          await addCropUseCase(uid, garden.id, row, col, plantData);
          overwrittenCount++;
        } else {
          await addCropUseCase(uid, garden.id, row, col, plantData);
          plantedCount++;
        }
      }
      if (deleteHistory && overwrittenCount > 0) setGardenTotals((prev) => ({ totalUnits: Math.max(0, prev.totalUnits - totalRemovedUnits), totalGrams: Math.max(0, prev.totalGrams - totalRemovedGrams) }));
      setShowPlantSelectedModal(false);
      setShowOverwriteConfirm(false);
      setPendingPlantData(null);
      clearSelection();
      await onUpdate();
      setLoadingToast(null);
      notify.success({ title: 'Plantación completada', description: overwrittenCount > 0 ? `${plantData?.emoji || ''} ${plantData?.name || 'Cultivo'} · ${plantedCount} nuevas, ${overwrittenCount} sobrescritas` : `${plantData?.emoji || ''} ${plantData?.name || 'Cultivo'} · ${plantedCount} parcelas` });
    } catch (e) {
      console.error(e);
      setLoadingToast(null);
      notify.error({ title: 'Error', description: 'No se pudo completar la plantación' });
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleDeleteSelected = async (deleteHistory = false) => {
    if (!uid || !garden || selectedCells.size === 0) return;
    setLoadingToast('Eliminando cultivos...');
    try {
      setProcessingBulk(true);
      let deletedCount = 0, totalRemovedUnits = 0, totalRemovedGrams = 0;
      for (const cellKey of selectedCells) {
        const [rowStr, colStr] = cellKey.split('-');
        const row = parseInt(rowStr), col = parseInt(colStr);
        const currentPlant = garden.plants[row]?.[col];
        if (currentPlant) {
          const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(uid, garden.id, row, col, { deleteHistory });
          totalRemovedUnits += removedUnits; totalRemovedGrams += removedGrams; deletedCount++;
        }
      }
      if (deleteHistory) setGardenTotals((prev) => ({ totalUnits: Math.max(0, prev.totalUnits - totalRemovedUnits), totalGrams: Math.max(0, prev.totalGrams - totalRemovedGrams) }));
      setShowDeleteSelectedConfirm(false);
      clearSelection();
      await onUpdate();
      setLoadingToast(null);
      notify.error({ title: 'Eliminación completada', description: `${deletedCount} cultivos eliminados` });
    } catch (e) {
      console.error(e);
      setLoadingToast(null);
      notify.error({ title: 'Error', description: 'No se pudo completar la eliminación' });
    } finally {
      setProcessingBulk(false);
    }
  };

  useEffect(() => {
    if (!uid || !garden?.id) return;
    getGardenTotalsUseCase(uid, garden.id).then(setGardenTotals).catch(console.error);
  }, [uid, garden?.id]);

  useEffect(() => {
    if (!garden?.id) return;
    onTotalsUpdate?.(garden.id, gardenTotals);
  }, [garden?.id, gardenTotals?.totalUnits, gardenTotals?.totalGrams]);

  const handleHarvest = async (harvestInfo) => {
    if (!uid || !selectedCell) return;
    try {
      setSavingCell(true);
      const savedEntry = await addHarvestUseCase(uid, garden.id, selectedCell.row, selectedCell.col, harvestInfo);
      setGardenTotals((prev) => ({ totalUnits: Math.max(0, prev.totalUnits + (harvestInfo.units || 0)), totalGrams: Math.max(0, prev.totalGrams + (harvestInfo.totalGrams || 0)) }));
      if (tableApiRef.current?.addHarvest) {
        tableApiRef.current.addHarvest(selectedCell.row, selectedCell.col, {
          id: savedEntry?.id ?? `optimistic_${Date.now()}`,
          units: harvestInfo.units, gramsPerUnit: harvestInfo.gramsPerUnit, totalGrams: harvestInfo.totalGrams,
          harvestDate: { toDate: () => new Date() }, plantId: harvestInfo.plantId, plantName: harvestInfo.plantName, plantEmoji: harvestInfo.plantEmoji,
        });
      }
      setShowPlantModal(false);
      setSelectedCell(null);
      notify.success({ title: 'Recolectado', description: `${harvestInfo.plantEmoji || ''} ${harvestInfo.plantName || 'Cultivo'} · ${harvestInfo.units} ud${harvestInfo.totalGrams ? ` · ${Math.round(harvestInfo.totalGrams)}g` : ''}` });
    } catch (e) {
      console.error(e);
      notify.error({ title: 'Error', description: 'No se pudo registrar la cosecha.' });
    } finally {
      setSavingCell(false);
    }
  };

  const executeBulkFromTable = async (action, cells, plantData = null, deleteHistory = false) => {
    if (!uid || !garden || cells.size === 0) return;
    setLoadingToast(action === 'plant' ? 'Plantando cultivos...' : 'Eliminando cultivos...');
    try {
      setProcessingBulk(true);
      let count = 0, totalRemovedUnits = 0, totalRemovedGrams = 0;
      for (const cellKey of cells) {
        const [rowStr, colStr] = cellKey.split('-');
        const row = parseInt(rowStr), col = parseInt(colStr);
        const currentPlant = garden.plants[row]?.[col];
        if (action === 'plant') {
          if (currentPlant) {
            const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(uid, garden.id, row, col, { deleteHistory });
            totalRemovedUnits += removedUnits; totalRemovedGrams += removedGrams;
          }
          await addCropUseCase(uid, garden.id, row, col, { ...plantData, id: `${Date.now()}_${row}_${col}_${Math.random().toString(16).slice(2)}` });
          count++;
        } else if (action === 'delete' && currentPlant) {
          const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(uid, garden.id, row, col, { deleteHistory });
          totalRemovedUnits += removedUnits; totalRemovedGrams += removedGrams; count++;
        }
      }
      if (deleteHistory) setGardenTotals((prev) => ({ totalUnits: Math.max(0, prev.totalUnits - totalRemovedUnits), totalGrams: Math.max(0, prev.totalGrams - totalRemovedGrams) }));
      setShowTablePlantModal(false); setShowTableDeleteConfirm(false); setTableBulkCells(new Set());
      await onUpdate();
      setTableRefreshKey((k) => k + 1);
      setLoadingToast(null);
      if (action === 'plant') notify.success({ title: 'Plantación completada', description: `${plantData?.emoji || ''} ${plantData?.name || 'Cultivo'} · ${count} parcelas` });
      else notify.error({ title: 'Eliminación completada', description: `${count} cultivos eliminados` });
    } catch (e) {
      console.error(e);
      setLoadingToast(null);
      notify.error({ title: 'Error', description: 'No se pudo completar la operación' });
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (selectedCells.size > 0) clearSelection();
    setSelectedCell({ row: rowIndex, col: colIndex });
    setShowPlantModal(true);
  };

  const handleAddPlant = async (plantData, meta) => {
    if (!uid || !selectedCell) return;
    try {
      setSavingCell(true);
      await addCropUseCase(uid, garden.id, selectedCell.row, selectedCell.col, plantData);
      setShowPlantModal(false);
      setSelectedCell(null);
      notify.success({ title: meta?.mode === 'create' ? 'Cultivo añadido' : 'Cultivo editado', description: `${plantData?.emoji || ''} ${plantData?.name || 'Cultivo'}` });
    } catch (e) {
      console.error(e);
      notify.error({ title: 'Error', description: 'No se pudo guardar la planta.' });
    } finally {
      setSavingCell(false);
    }
  };

  const handleRemovePlant = async (options = {}) => {
    if (!uid || !selectedCell) return;
    try {
      setSavingCell(true);
      const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(uid, garden.id, selectedCell.row, selectedCell.col, options);
      if (options?.deleteHistory) setGardenTotals((prev) => ({ totalUnits: Math.max(0, prev.totalUnits - Math.max(0, removedUnits)), totalGrams: Math.max(0, prev.totalGrams - Math.max(0, removedGrams)) }));
      setShowPlantModal(false);
      setSelectedCell(null);
      await onUpdate();
      notify.error(options?.deleteHistory ? { title: 'Eliminado', description: 'Cultivo + historial borrados' } : { title: 'Cultivo eliminado', description: 'Historial conservado en BD' });
    } catch (e) {
      console.error(e);
      notify.error({ title: 'Error', description: 'No se pudo eliminar la planta.' });
    } finally {
      setSavingCell(false);
    }
  };

  const currentPlant = selectedCell ? garden.plants[selectedCell.row]?.[selectedCell.col] : null;
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const gapPx = 8;
  const { ref: gridRef, cellSize } = useCellSize({ cols: garden.grid.columns, gapPx, preferred: isMobile ? 36 : 100, min: isMobile ? 14 : 18 });
  const emptyCells = garden.plants.flat().filter((p) => p === null).length;
  const plantedCells = garden.plants.flat().filter((p) => p !== null).length;

  return (
    <div className="fixed inset-0 bg-[#E0F2E9] z-50 overflow-y-auto">
      <Toaster position="top-center" style={{ zIndex: 99999 }} />
      <LoadingToast message={loadingToast} />

      <header className="bg-white/80 backdrop-blur-md border-b border-[#CEB5A7]/30 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="w-12 h-12 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl flex items-center justify-center hover:shadow-xl transition-all cursor-pointer">
                <IoArrowBackOutline className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-[#5B7B7A]">{garden.name}</h1>
                  <p className="text-sm text-[#A17C6B]">{garden.dimensions.width}m × {garden.dimensions.height}m | {garden.grid.columns}×{garden.grid.rows} parcelas</p>
                </div>
                <div className="flex items-center bg-white border-2 border-[#CEB5A7]/40 rounded-xl p-1 gap-1">
                  <HoverTooltip label="Vista cuadrícula" mode="auto">
                    <button onClick={() => setViewMode('grid')} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white shadow' : 'text-[#A17C6B] hover:bg-[#E0F2E9]'}`}>
                      <IoGridOutline className="w-5 h-5" />
                    </button>
                  </HoverTooltip>
                  <HoverTooltip label="Vista tabla" mode="auto">
                    <button onClick={() => setViewMode('table')} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white shadow' : 'text-[#A17C6B] hover:bg-[#E0F2E9]'}`}>
                      <IoListOutline className="w-5 h-5" />
                    </button>
                  </HoverTooltip>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HoverTooltip label="Eliminar huerto" mode="auto" className="inline-flex">
                <button onClick={() => setShowDeleteGardenConfirm(true)} disabled={processingBulk} className="group flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium cursor-pointer">
                  <IoTrashOutline className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                </button>
              </HoverTooltip>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <IoGridOutline className="w-4 h-4" />, label: 'Parcelas totales', value: garden.grid.rows * garden.grid.columns },
              { icon: <IoLeafOutline className="w-4 h-4" />, label: 'Plantadas', value: plantedCells },
              { icon: <IoBasketOutline className="w-4 h-4" />, label: 'Unidades cosechadas', value: gardenTotals.totalUnits },
              {
                icon: <IoScaleOutline className="w-4 h-4" />, label: 'Peso total',
                value: gardenTotals.totalGrams <= 0 ? '—' : gardenTotals.totalGrams < 1000 ? `${Math.round(gardenTotals.totalGrams)} g` : `${(gardenTotals.totalGrams / 1000).toFixed(1)} kg`
              },
            ].map(({ icon, label, value }, i) => (
              <div key={i} className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-2xl p-4 text-white flex flex-col items-center justify-center text-center min-h-[96px]">
                <div className="flex items-center justify-center gap-2 mb-1">{icon}<p className="text-xs opacity-90">{label}</p></div>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {viewMode === 'grid' && (
            <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-6 md:p-8">
              <div className="mb-6 flex flex-col items-center justify-center gap-3">
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  {emptyCells > 0 && (
                    <button onClick={() => setShowPlantAllModal(true)} disabled={processingBulk} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-medium text-sm disabled:opacity-60 cursor-pointer">
                      <GiPlantSeed className="w-4 h-4" /><span>Plantar todo</span>
                    </button>
                  )}
                  {plantedCells > 0 && (
                    <button onClick={() => setShowDeleteAllConfirm(true)} disabled={processingBulk} className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all font-medium text-sm disabled:opacity-60 cursor-pointer">
                      <IoTrashOutline className="w-4 h-4" /><span>Eliminar todo</span>
                    </button>
                  )}
                </div>
                {selectedCells.size > 0 && (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-[#5B7B7A]">Selección: {selectedCells.size}</span>
                      <button type="button" onClick={clearSelection} className="px-3 py-2 rounded-xl border-2 border-[#CEB5A7] text-[#5B7B7A] hover:bg-[#E0F2E9] font-bold text-sm">Limpiar</button>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button onClick={() => setShowPlantSelectedModal(true)} disabled={processingBulk} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm disabled:opacity-60 cursor-pointer">
                        <GiPlantSeed className="w-4 h-4" /><span>Plantar selección</span>
                      </button>
                      <button onClick={() => setShowDeleteSelectedConfirm(true)} disabled={processingBulk} className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-medium text-sm disabled:opacity-60 cursor-pointer">
                        <IoTrashOutline className="w-4 h-4" /><span>Eliminar selección</span>
                      </button>
                    </div>
                  </div>
                )}
                {selectedCells.size === 0 && <p className="text-sm text-[#A17C6B] text-center">Click en cada parcela para gestionarla (o arrastra para seleccionar varias)</p>}
              </div>

              <div className="overflow-x-auto">
                <div className="w-full flex justify-center">
                  <div ref={gridWrapRef} className="relative select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                    onContextMenu={(e) => e.preventDefault()}
                    onPointerDown={handlers.onPointerDown} onPointerMove={handlers.onPointerMove} onPointerUp={handlers.onPointerUp}>
                    <div className="rounded-2xl p-3 bg-[#E0F2E9] border-2 border-[#CEB5A7]/30">
                      <div ref={gridRef} className="grid" style={{ gap: `${gapPx}px`, gridTemplateColumns: `repeat(${garden.grid.columns}, ${cellSize}px)` }}>
                        {garden.plants.map((row, rowIndex) =>
                          row.map((plant, colIndex) => {
                            const hasPlant = plant !== null;
                            const plantInfo = hasPlant && plant.category && plant.type ? CROPS_DATABASE[plant.category]?.types[plant.type] : null;
                            const k = keyOf(rowIndex, colIndex);
                            const isSelected = selectedCells.has(k);
                            return (
                              <button ref={(el) => { cellRefs.current[k] = el; }} key={k}
                                onClick={(e) => { if (wasDragRef.current) { e.preventDefault(); e.stopPropagation(); return; } if (selectedCells.size > 0) return; handleCellClick(rowIndex, colIndex); }}
                                disabled={savingCell || processingBulk}
                                className={`rounded-lg border-2 transition-all relative group ${hasPlant ? 'border-2 hover:shadow-lg' : 'bg-[#CEB5A7] border-2 border-[#5B7B7A]/50 hover:border-4 hover:border-[#5B7B7A]'} ${savingCell || processingBulk ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'ring-4 ring-[#5B7B7A]/40 border-[#5B7B7A]' : ''}`}
                                style={{ width: cellSize, height: cellSize, backgroundColor: plantInfo?.color || (hasPlant ? '#5B7B7A' : undefined), borderColor: plantInfo?.color || (hasPlant ? '#5B7B7A' : undefined) }}
                                title={`Parcela ${rowIndex}, ${colIndex}`}>
                                {hasPlant ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                                    {plantInfo ? (
                                      <><span className="mb-0.5" style={{ fontSize: Math.min(cellSize * 0.5, 32) }}>{plantInfo.emoji}</span><p className="text-white font-bold truncate w-full text-center leading-none drop-shadow-md" style={{ fontSize: Math.max(8, Math.min(10, Math.floor(cellSize / 4))) }}>{plantInfo.name}</p></>
                                    ) : (
                                      <><IoLeafOutline className="text-white mb-0.5" style={{ width: Math.min(16, cellSize * 0.5), height: Math.min(16, cellSize * 0.5) }} /><p className="text-[10px] text-white font-bold truncate w-full text-center leading-none" style={{ fontSize: Math.max(8, Math.min(10, Math.floor(cellSize / 4))) }}>{plant.name}</p></>
                                    )}
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <IoAddOutline className="text-[#5B7B7A]" style={{ width: Math.min(18, cellSize * 0.6), height: Math.min(18, cellSize * 0.6) }} />
                                  </div>
                                )}
                                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-30">{rowIndex},{colIndex}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                    {isSelecting && overlayStyle && <div className="absolute z-30 border-2 border-[#5B7B7A] bg-[#5B7B7A]/10 rounded-lg pointer-events-none" style={overlayStyle} />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'table' && (
            <TableView uid={uid} gardenId={garden.id} garden={garden} onCellClick={handleCellClick}
              processingBulk={processingBulk} refreshKey={tableRefreshKey}
              onReady={(api) => { tableApiRef.current = api; }}
              onBulkAction={(action, cells) => { setTableBulkCells(cells); if (action === 'plant') setShowTablePlantModal(true); else if (action === 'delete') setShowTableDeleteConfirm(true); }} />
          )}
        </div>
      </main>

      {showPlantModal && (
        <PlantModal uid={uid} gardenId={garden.id} plant={currentPlant} position={selectedCell} saving={savingCell}
          onClose={() => { setShowPlantModal(false); setSelectedCell(null); }}
          onSave={(plantData, meta) => handleAddPlant(plantData, meta)}
          onRemove={currentPlant ? (opts) => handleRemovePlant(opts) : null}
          onHarvest={currentPlant ? handleHarvest : null} />
      )}

      {showPlantAllModal && <PlantAllModal onClose={() => setShowPlantAllModal(false)} onConfirm={handlePlantAll} processing={processingBulk} emptyCells={emptyCells} />}

      <ConfirmModal isOpen={showDeleteAllConfirm} onClose={() => setShowDeleteAllConfirm(false)} title="Eliminar todos los cultivos"
        description={`Se eliminarán ${plantedCells} cultivos. ¿Qué quieres hacer con el historial?`} variant="danger"
        actions={[
          { label: 'Cancelar', style: 'cancel', onClick: () => setShowDeleteAllConfirm(false), disabled: processingBulk },
          { label: 'Eliminar cultivos (mantener historial)', style: 'ghost', onClick: () => handleDeleteAll(false), disabled: processingBulk },
          { label: 'Eliminar cultivos + historial', style: 'danger', onClick: () => handleDeleteAll(true), disabled: processingBulk },
        ]} />

      {showPlantSelectedModal && <PlantAllModal onClose={() => setShowPlantSelectedModal(false)} onConfirm={handlePlantSelected} processing={processingBulk} emptyCells={selectedCells.size} title="Plantar en celdas seleccionadas" message={`Se plantarán las ${selectedCells.size} celdas vacías seleccionadas`} />}

      <ConfirmModal isOpen={showDeleteSelectedConfirm} onClose={() => setShowDeleteSelectedConfirm(false)} title="Eliminar cultivos seleccionados"
        description={`Se eliminarán los cultivos de ${selectedCells.size} parcelas. ¿Qué quieres hacer con el historial?`} variant="danger"
        actions={[
          { label: 'Cancelar', style: 'cancel', onClick: () => setShowDeleteSelectedConfirm(false), disabled: processingBulk },
          { label: 'Eliminar cultivos (mantener historial)', style: 'ghost', onClick: () => handleDeleteSelected(false), disabled: processingBulk },
          { label: 'Eliminar cultivos + historial', style: 'danger', onClick: () => handleDeleteSelected(true), disabled: processingBulk },
        ]} />

      {showOverwriteConfirm && pendingPlantData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowOverwriteConfirm(false); setPendingPlantData(null); }}>
          <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-orange-300 shadow-xl p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h4 className="text-base sm:text-lg font-bold text-orange-600">⚠️ Sobrescribir cultivos existentes</h4>
              <p className="text-xs sm:text-sm text-[#A17C6B] mt-2">De las {selectedCells.size} celdas seleccionadas:</p>
              <div className="mt-2 text-sm font-bold">
                <p className="text-green-600">✓ {overwriteStats.empty} vacías (se plantarán)</p>
                <p className="text-orange-600">⚠ {overwriteStats.occupied} ocupadas (se sobrescribirán)</p>
              </div>
              <p className="text-xs text-[#A17C6B] mt-3">¿Qué quieres hacer con el historial de las {overwriteStats.occupied} parcelas ocupadas?</p>
            </div>
            <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-2 sm:gap-3">
              <button type="button" onClick={() => { setShowOverwriteConfirm(false); setPendingPlantData(null); }} disabled={processingBulk} className="w-full px-4 py-2.5 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold text-sm cursor-pointer">Cancelar</button>
              <button type="button" onClick={() => executePlantSelected(pendingPlantData, false)} disabled={processingBulk} className="w-full px-4 py-2.5 border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold text-sm cursor-pointer">Sobrescribir (mantener historial)</button>
              <button type="button" onClick={() => executePlantSelected(pendingPlantData, true)} disabled={processingBulk} className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-bold text-sm cursor-pointer">Sobrescribir + borrar historial</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteGardenConfirm} onClose={() => setShowDeleteGardenConfirm(false)} title="Eliminar huerto"
        description="¿Seguro que quieres eliminar este huerto? Esta acción no se puede deshacer." variant="danger"
        actions={[
          { label: 'Cancelar', style: 'cancel', onClick: () => setShowDeleteGardenConfirm(false), disabled: deletingGarden },
          { label: 'Eliminar huerto', style: 'danger', onClick: confirmDeleteGarden, disabled: deletingGarden },
        ]} />

      {showTablePlantModal && <PlantAllModal onClose={() => { setShowTablePlantModal(false); setTableBulkCells(new Set()); }} onConfirm={(plantData) => executeBulkFromTable('plant', tableBulkCells, plantData, false)} processing={processingBulk} emptyCells={tableBulkCells.size} title="Plantar parcelas seleccionadas" message={`Se plantarán ${tableBulkCells.size} parcelas (las ocupadas se sobrescribirán)`} />}

      <ConfirmModal isOpen={showTableDeleteConfirm} onClose={() => { setShowTableDeleteConfirm(false); setTableBulkCells(new Set()); }} title="Eliminar cultivos seleccionados"
        description={`Se eliminarán los cultivos de ${tableBulkCells.size} parcelas. ¿Qué quieres hacer con el historial?`} variant="danger"
        actions={[
          { label: 'Cancelar', style: 'cancel', onClick: () => { setShowTableDeleteConfirm(false); setTableBulkCells(new Set()); }, disabled: processingBulk },
          { label: 'Eliminar cultivos (mantener historial)', style: 'ghost', onClick: () => executeBulkFromTable('delete', tableBulkCells, null, false), disabled: processingBulk },
          { label: 'Eliminar cultivos + historial', style: 'danger', onClick: () => executeBulkFromTable('delete', tableBulkCells, null, true), disabled: processingBulk },
        ]} />
    </div>
  );
};

// ===================== PlantAllModal =====================
const PlantAllModal = ({ onClose, onConfirm, processing, emptyCells, title = "Plantar en todas las parcelas vacías", message = null }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({ plantedDate: new Date().toISOString().split('T')[0], wateringDays: 3 });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory || !selectedType) return;
    const plantInfo = CROPS_DATABASE[selectedCategory].types[selectedType];
    onConfirm({ category: selectedCategory, type: selectedType, name: plantInfo.name, emoji: plantInfo.emoji, color: plantInfo.color, plantedDate: formData.plantedDate, wateringDays: formData.wateringDays });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-b-2 border-[#CEB5A7]/30 p-4 sm:p-6">
          <div className="relative flex items-start justify-between gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
            <div className="flex-1 min-w-0 text-center">
              <h3 className="text-lg sm:text-xl font-bold text-[#5B7B7A]">{title}</h3>
              <p className="text-xs sm:text-sm text-[#A17C6B] mt-1">{message || `Se plantarán ${emptyCells} parcelas`}</p>
            </div>
            <button onClick={onClose} disabled={processing} className={`w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-[#CEB5A7] rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all ${processing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <IoClose className="w-4 h-4 sm:w-5 sm:h-5 text-[#5B7B7A]" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2">Categoría</label>
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedType(''); }} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-sm sm:text-base cursor-pointer" required disabled={processing}>
              <option value="">Selecciona una categoría</option>
              {Object.entries(CROPS_DATABASE).map(([key, data]) => <option key={key} value={key}>{data.emoji} {data.label}</option>)}
            </select>
          </div>
          {selectedCategory && (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2">Tipo de {CROPS_DATABASE[selectedCategory].label}</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {Object.entries(CROPS_DATABASE[selectedCategory].types).map(([key, plantType]) => (
                  <button key={key} type="button" onClick={() => setSelectedType(key)} disabled={processing}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedType === key ? 'border-[#5B7B7A] bg-[#E0F2E9] shadow-md scale-105' : 'border-[#CEB5A7]/50 hover:border-[#5B7B7A] hover:bg-[#E0F2E9]/30'} ${processing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-2xl sm:text-4xl">{plantType.emoji}</span>
                      <span className="font-medium text-gray-800 text-xs sm:text-base">{plantType.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2">Fecha de plantación</label>
            <input type="date" value={formData.plantedDate} onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all cursor-pointer text-sm sm:text-base" disabled={processing} />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2"><IoWaterOutline className="w-4 h-4 sm:w-5 sm:h-5" />Riego cada (días)</label>
            <input type="number" value={formData.wateringDays} onChange={(e) => setFormData({ ...formData, wateringDays: parseInt(e.target.value, 10) })} min="1" max="30" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all cursor-pointer text-sm sm:text-base" disabled={processing} />
          </div>
        </form>
        <div className="sticky bottom-0 z-20 bg-white border-t-2 border-[#CEB5A7]/30 p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <button type="button" onClick={onClose} disabled={processing} className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold text-sm sm:text-base ${processing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>Cancelar</button>
            <button type="submit" onClick={handleSubmit} disabled={processing || !selectedCategory || !selectedType} className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm sm:text-base ${processing || !selectedCategory || !selectedType ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              {processing ? 'Plantando...' : `Plantar ${emptyCells}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================== PlantModal =====================
const PlantModal = ({ uid, gardenId, plant, position, saving, onClose, onSave, onRemove, onHarvest }) => {
  const [view, setView] = useState(plant ? 'harvest' : 'edit');
  const [selectedCategory, setSelectedCategory] = useState(plant?.category || '');
  const [selectedType, setSelectedType] = useState(plant?.type || '');
  const [formData, setFormData] = useState({ plantedDate: plant?.plantedDate || new Date().toISOString().split('T')[0], wateringDays: plant?.wateringDays || 3 });
  const [harvestData, setHarvestData] = useState({ units: '', gramsPerUnit: '' });
  const [harvestHistory, setHarvestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activePlantId = useMemo(() => plant?.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`, [plant?.id, position?.row, position?.col]);

  useEffect(() => {
    setView(plant ? 'harvest' : 'edit');
    setSelectedCategory(plant?.category || '');
    setSelectedType(plant?.type || '');
    setFormData({ plantedDate: plant?.plantedDate || new Date().toISOString().split('T')[0], wateringDays: plant?.wateringDays || 3 });
    setHarvestData({ units: '', gramsPerUnit: '' });
    setHarvestHistory([]);
    setShowHistoryDetails(false);
    setShowDeleteConfirm(false);
  }, [plant, position?.row, position?.col]);

  useEffect(() => {
    if (!uid || !gardenId || position === null) return;
    setLoadingHistory(true);
    getPlotHarvestsUseCase(uid, gardenId, position.row, position.col)
      .then(setHarvestHistory).catch(console.error).finally(() => setLoadingHistory(false));
  }, [uid, gardenId, position?.row, position?.col]);

  const historyTotals = harvestHistory.reduce((acc, h) => ({ units: acc.units + (h.units || 0), grams: acc.grams + (h.totalGrams || 0) }), { units: 0, grams: 0 });
  const currentPlantInfo = plant?.category && plant?.type ? CROPS_DATABASE[plant.category]?.types[plant.type] : selectedCategory && selectedType ? CROPS_DATABASE[selectedCategory]?.types[selectedType] : null;

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory || !selectedType) { notify.error({ title: 'Faltan datos', description: 'Selecciona categoría y tipo' }); return; }
    const plantInfo = CROPS_DATABASE[selectedCategory].types[selectedType];
    onSave?.({ id: plant ? plant.id : activePlantId, category: selectedCategory, type: selectedType, name: plantInfo.name, emoji: plantInfo.emoji, color: plantInfo.color, plantedDate: formData.plantedDate, wateringDays: formData.wateringDays }, { mode: plant ? 'edit' : 'create' });
  };

  const handleHarvestSubmit = async (e) => {
    e.preventDefault();
    if (!harvestData.units || Number(harvestData.units) <= 0) { notify.error({ title: 'Cantidad inválida', description: 'Introduce unidades válidas' }); return; }
    if (!harvestData.gramsPerUnit || Number(harvestData.gramsPerUnit) <= 0) { notify.error({ title: 'Peso requerido', description: 'Introduce los gramos por unidad' }); return; }
    const units = parseInt(harvestData.units, 10);
    const gramsPerUnit = parseFloat(harvestData.gramsPerUnit);
    await onHarvest({ units, gramsPerUnit, totalGrams: units * gramsPerUnit, plantId: plant?.id, plantName: plant?.name, plantEmoji: plant?.emoji });
    const history = await getPlotHarvestsUseCase(uid, gardenId, position.row, position.col);
    setHarvestHistory(history);
    setHarvestData({ units: '', gramsPerUnit: '' });
    setShowHistoryDetails(false);
  };

  const confirmDelete = async (deleteHistory = false) => {
    try { setShowDeleteConfirm(false); await onRemove?.({ deleteHistory }); }
    catch (e) { console.error(e); notify.error({ title: 'Error', description: 'No se pudo eliminar' }); }
  };

  const fmtGrams = (g) => g < 1000 ? `${Math.round(g)}g` : `${(g / 1000).toFixed(1)}kg`;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-b-2 border-[#CEB5A7]/30 p-6 sticky top-0 z-20">
          <div className="relative flex items-start justify-between gap-4">
            <div className="w-10 h-10 shrink-0" />
            <div className="flex-1 min-w-0 text-center">
              <h3 className="text-xl font-bold text-[#5B7B7A]">{plant ? 'Gestionar planta' : 'Añadir Planta'}</h3>
              <p className="text-sm text-[#A17C6B] truncate">Parcela [{position?.row}, {position?.col}]{plant && currentPlantInfo && ` - ${currentPlantInfo.emoji} ${currentPlantInfo.name}`}</p>
            </div>
            <button onClick={onClose} disabled={saving} className={`w-10 h-10 bg-white border-2 border-[#CEB5A7] rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <IoClose className="w-5 h-5 text-[#5B7B7A]" />
            </button>
          </div>
          {plant && (
            <div className="mt-5">
              <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-1 flex">
                {['harvest', 'edit'].map((v) => (
                  <button key={v} type="button" onClick={() => setView(v)} disabled={saving}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${view === v ? 'bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white shadow' : 'text-[#5B7B7A] hover:bg-[#E0F2E9]'} ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {v === 'harvest' ? 'Recolectar' : 'Editar'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {view === 'harvest' && plant && (
            <form id="harvest-form" onSubmit={handleHarvestSubmit} className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-2 border-[#CEB5A7]/50 rounded-2xl p-4 sm:p-6">
                <div className="text-center mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-[#A17C6B]">Plantado el {new Date(plant.plantedDate).toLocaleDateString('es-ES')}</p>
                </div>
                {loadingHistory ? <p className="text-center text-xs sm:text-sm text-[#A17C6B]">Cargando historial...</p>
                  : harvestHistory.length > 0 ? (
                    <div className="border-t-2 border-[#CEB5A7]/30 pt-4 mt-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#5B7B7A]/20 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#5B7B7A]/10"><IoBasketOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#5B7B7A]" /></span>
                            <p className="text-[11px] sm:text-xs text-[#A17C6B]">Total recolectado</p>
                          </div>
                          <p className="text-2xl sm:text-3xl font-bold text-[#5B7B7A] leading-none">{historyTotals.units}</p>
                          <p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">unidades</p>
                        </div>
                        {historyTotals.grams > 0 && (
                          <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#5B7B7A]/20 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#5B7B7A]/10"><IoScaleOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#5B7B7A]" /></span>
                              <p className="text-[11px] sm:text-xs text-[#A17C6B]">Peso total</p>
                            </div>
                            {historyTotals.grams < 1000
                              ? <><p className="text-2xl sm:text-3xl font-bold text-[#5B7B7A] leading-none">{Math.round(historyTotals.grams)}</p><p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">gramos</p></>
                              : <><p className="text-2xl sm:text-3xl font-bold text-[#5B7B7A] leading-none">{(historyTotals.grams / 1000).toFixed(1)}</p><p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">kilogramos</p></>}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => setShowHistoryDetails(!showHistoryDetails)} className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#5B7B7A]/10 hover:bg-[#5B7B7A]/20 rounded-xl transition-all font-medium text-[#5B7B7A] text-sm sm:text-base">
                        {showHistoryDetails ? <><IoChevronUpOutline className="w-4 h-4 sm:w-5 sm:h-5" />Ocultar detalles</> : <><IoChevronDownOutline className="w-4 h-4 sm:w-5 sm:h-5" />Ver más ({harvestHistory.length})</>}
                      </button>
                      {showHistoryDetails && (
                        <div className="mt-3 sm:mt-4 space-y-3 max-h-60 overflow-y-auto pr-1">
                          {harvestHistory.map((harvest) => {
                            const date = harvest.harvestDate?.toDate?.() || new Date();
                            return (
                              <div key={harvest.id} className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#CEB5A7]/30">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <p className="font-bold text-[#5B7B7A] text-sm sm:text-base">{harvest.units} unidades</p>
                                    <p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  {harvest.totalGrams && <div className="text-right"><p className="font-bold text-[#5B7B7A] text-sm sm:text-base">{Math.round(harvest.totalGrams)}g</p><p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">{harvest.gramsPerUnit}g/ud</p></div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : <p className="text-center text-xs sm:text-sm text-[#A17C6B]">Aún no hay cosechas registradas</p>}
              </div>
              <div className="border-t-2 border-[#CEB5A7]/30 pt-6">
                <h4 className="text-lg font-bold text-[#5B7B7A] mb-4">Nueva Cosecha</h4>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2"><IoBasketOutline className="w-5 h-5" />Cantidad de unidades recolectadas</label>
                  <input type="number" value={harvestData.units} onChange={(e) => setHarvestData({ ...harvestData, units: e.target.value })} min="1" step="1" required placeholder="Ej: 15" className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-lg font-medium" disabled={saving} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2"><IoScaleOutline className="w-5 h-5" />Gramos por unidad</label>
                  <input type="number" value={harvestData.gramsPerUnit} onChange={(e) => setHarvestData({ ...harvestData, gramsPerUnit: e.target.value })} min="0.1" step="0.1" required placeholder="Ej: 150" className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-lg font-medium" disabled={saving} />
                </div>
              </div>
              <div className="h-24" />
            </form>
          )}

          {view === 'edit' && (
            <form id="edit-form" onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#5B7B7A] mb-2">Categoría</label>
                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedType(''); }} className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-base cursor-pointer" required disabled={saving}>
                  <option value="">Selecciona una categoría</option>
                  {Object.entries(CROPS_DATABASE).map(([key, data]) => <option key={key} value={key}>{data.emoji} {data.label}</option>)}
                </select>
              </div>
              {selectedCategory && (
                <div>
                  <label className="block text-sm font-bold text-[#5B7B7A] mb-2">Tipo de {CROPS_DATABASE[selectedCategory].label}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(CROPS_DATABASE[selectedCategory].types).map(([key, plantType]) => (
                      <button key={key} type="button" onClick={() => setSelectedType(key)} disabled={saving}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedType === key ? 'border-[#5B7B7A] bg-[#E0F2E9] shadow-md scale-105' : 'border-[#CEB5A7]/50 hover:border-[#5B7B7A] hover:bg-[#E0F2E9]/30'} ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex items-center gap-3"><span className="text-2xl">{plantType.emoji}</span><span className="font-medium text-gray-800">{plantType.name}</span></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-[#5B7B7A] mb-2">Fecha de plantación</label>
                <input type="date" value={formData.plantedDate} onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })} className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all" disabled={saving} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2"><IoWaterOutline className="w-5 h-5" />Riego cada (días)</label>
                <input type="number" value={formData.wateringDays} onChange={(e) => setFormData({ ...formData, wateringDays: parseInt(e.target.value, 10) })} min="1" max="30" className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all" disabled={saving} />
              </div>
              <div className="h-24" />
            </form>
          )}
        </div>

        <div className="sticky bottom-0 z-20 bg-white border-t-2 border-[#CEB5A7]/30 p-4">
          {view === 'harvest' && plant && (
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={saving} className={`px-6 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>Cancelar</button>
              <button type="submit" form="harvest-form" disabled={saving || !harvestData.units || !harvestData.gramsPerUnit} className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2 ${saving || !harvestData.units || !harvestData.gramsPerUnit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>Registrar Cosecha</button>
            </div>
          )}
          {view === 'edit' && (
            <div className="flex gap-3">
              {onRemove && <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={saving} className={`px-6 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>Eliminar</button>}
              <button type="submit" form="edit-form" disabled={saving || !selectedCategory || !selectedType} className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold ${saving || !selectedCategory || !selectedType ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>Guardar</button>
            </div>
          )}
        </div>

        <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar cultivo"
          description="Si mantienes el historial, no se borra nada de la base de datos." variant="danger"
          actions={[
            { label: 'Cancelar', style: 'cancel', onClick: () => setShowDeleteConfirm(false), disabled: saving },
            { label: 'Eliminar cultivo (mantener historial)', style: 'ghost', onClick: () => confirmDelete(false), disabled: saving },
            { label: 'Eliminar cultivo + historial', style: 'danger', onClick: () => confirmDelete(true), disabled: saving },
          ]} />
      </div>
    </div>
  );
};

export default GardenView;