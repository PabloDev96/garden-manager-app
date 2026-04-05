import { CROPS_DATABASE } from '../utils/cropsDatabase';

const ConfiguracionSection = ({ calendarCrops = [], onToggleCrop }) => (
    <div className="space-y-6">
        <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-[#5B7B7A] mb-1">Cultivos en el calendario</h3>
                <p className="text-sm text-[#A17C6B]">
                    Selecciona qué cultivos quieres ver en las tareas del calendario,
                    además de los que ya tienes plantados.
                </p>
            </div>

            <div className="space-y-6">
                {Object.entries(CROPS_DATABASE).map(([categoryKey, category]) => (
                    <div key={categoryKey}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">{category.emoji}</span>
                            <p className="text-xs font-bold text-[#5B7B7A] uppercase tracking-wider">
                                {category.label}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {Object.entries(category.types).map(([typeKey, crop]) => {
                                const active = calendarCrops.includes(crop.name);
                                return (
                                    <button
                                        key={typeKey}
                                        type="button"
                                        onClick={() => onToggleCrop(crop.name)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all cursor-pointer font-medium text-sm
                                            ${active
                                                ? 'border-[#5B7B7A] bg-[#E0F2E9] text-[#5B7B7A]'
                                                : 'border-[#CEB5A7]/40 bg-white text-[#A17C6B] hover:border-[#CEB5A7] hover:bg-[#F9F5F2]'
                                            }`}
                                    >
                                        <span className="text-base shrink-0">{crop.emoji}</span>
                                        <span className="truncate">{crop.name}</span>
                                        {active && (
                                            <span className="ml-auto shrink-0 w-2 h-2 rounded-full bg-[#5B7B7A]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {calendarCrops.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#CEB5A7]/30 flex items-center justify-between">
                    <p className="text-xs text-[#A17C6B]">
                        {calendarCrops.length} cultivo{calendarCrops.length !== 1 ? 's' : ''} seleccionado{calendarCrops.length !== 1 ? 's' : ''}
                    </p>
                    <button
                        type="button"
                        onClick={() => [...calendarCrops].forEach((name) => onToggleCrop(name))}
                        className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors cursor-pointer"
                    >
                        Limpiar selección
                    </button>
                </div>
            )}
        </div>
    </div>
);

export default ConfiguracionSection;
