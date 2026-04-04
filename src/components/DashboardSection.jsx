import {
    IoLeafOutline,
    IoWarningOutline,
    IoWaterOutline,
    IoSunnyOutline,
    IoTrendingUpOutline,
} from 'react-icons/io5';
import HarvestChart from './HarvestChart';

const DashboardSection = ({ uid, gardens }) => {
    const stats = [
        { label: 'Huertos Activos', value: gardens.length, icon: IoLeafOutline, color: 'bg-[#5B7B7A]' },
        { label: 'Alertas Pendientes', value: 0, icon: IoWarningOutline, color: 'bg-[#A17C6B]' },
        { label: 'Riego Hoy', value: 0, icon: IoWaterOutline, color: 'bg-[#5B7B7A]' },
        { label: 'Días de Sol', value: 5, icon: IoSunnyOutline, color: 'bg-[#CEB5A7]' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-4 sm:p-6 hover:shadow-lg hover:border-[#5B7B7A] transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className={`w-9 h-9 sm:w-12 sm:h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <IoTrendingUpOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#A17C6B] opacity-50" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-[#5B7B7A] mb-1">{stat.value}</p>
                        <p className="text-xs sm:text-sm text-[#A17C6B] font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {gardens.length > 0 && <HarvestChart uid={uid} gardens={gardens} />}
        </div>
    );
};

export default DashboardSection;
