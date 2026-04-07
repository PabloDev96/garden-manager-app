import { IoLeafOutline, IoAddOutline } from 'react-icons/io5';
import { PiPlant } from 'react-icons/pi';
import { IoIosNotificationsOutline } from 'react-icons/io';
import GardenCard from './Gardencard';
import HoverTooltip from './HoverTooltip';

const HuertosSection = ({ gardens, loadingGardens, gardenTotalsMap, onOpenGarden, onAddGarden, onAddAlert }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-center gap-3">
            <HoverTooltip label="Añadir huerto" mode="auto" className="inline-flex">
                <button
                    type="button"
                    onClick={onAddGarden}
                    className="group flex items-center gap-2 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white px-4 py-2.5 rounded-xl hover:shadow-xl transition-all font-bold cursor-pointer"
                    aria-label="Añadir huerto"
                >
                    <IoAddOutline className="w-5 h-5 transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110" />
                    <PiPlant className="w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-110" />
                </button>
            </HoverTooltip>

            <HoverTooltip label="Añadir recordatorio" mode="auto" className="inline-flex">
                <button type="button" onClick={onAddAlert}
                    className="group flex items-center gap-2 bg-white border-2 border-[#CEB5A7]/60 text-[#5B7B7A] px-4 py-2.5 rounded-xl hover:shadow-lg hover:border-[#5B7B7A] transition-all font-bold cursor-pointer">
                    <IoAddOutline className="w-5 h-5 transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110" />
                    <IoIosNotificationsOutline className="w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-110" />
                </button>
            </HoverTooltip>
        </div>

        {loadingGardens ? (
            <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-10 text-center">
                <p className="text-[#A17C6B]">Cargando huertos...</p>
            </div>
        ) : gardens.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#CEB5A7] rounded-3xl p-16 text-center">
                <div className="w-20 h-20 bg-[#E0F2E9] rounded-full flex items-center justify-center mx-auto mb-6">
                    <IoLeafOutline className="w-10 h-10 text-[#5B7B7A]" />
                </div>
                <h3 className="text-2xl font-bold text-[#5B7B7A] mb-2">No tienes huertos activos</h3>
                <p className="text-[#A17C6B] mb-8 max-w-md mx-auto">
                    Crea tu primer huerto para empezar a monitorizar tus plantas y recibir alertas de riego
                </p>
                <button
                    onClick={onAddGarden}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all font-bold group cursor-pointer"
                >
                    <IoAddOutline className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Crear Mi Primer Huerto
                </button>
            </div>
        ) : (
            <div className={gardens.length >= 3 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch" : "flex flex-wrap justify-center gap-6"}>
                {gardens.map((garden) => (
                    <HoverTooltip key={garden.id} label="Ver detalles" className={gardens.length >= 3 ? "h-full" : "w-full max-w-sm"}>
                        <div className={gardens.length >= 3 ? "h-full" : ""}>
                            <GardenCard
                                garden={{
                                    ...garden,
                                    totals: gardenTotalsMap[garden.id] ?? { totalUnits: 0, totalGrams: 0 },
                                }}
                                onClick={onOpenGarden}
                            />
                        </div>
                    </HoverTooltip>
                ))}
            </div>
        )}
    </div>
);

export default HuertosSection;
