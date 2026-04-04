import { IoSettingsOutline } from 'react-icons/io5';

const ConfiguracionSection = () => (
    <div className="space-y-6">
        <div className="bg-white border-2 border-dashed border-[#CEB5A7] rounded-3xl p-16 text-center">
            <div className="w-20 h-20 bg-[#E0F2E9] rounded-full flex items-center justify-center mx-auto mb-6">
                <IoSettingsOutline className="w-10 h-10 text-[#5B7B7A]" />
            </div>
            <h3 className="text-xl font-bold text-[#5B7B7A] mb-2">Configuración de la cuenta</h3>
            <p className="text-[#A17C6B] max-w-md mx-auto">
                Próximamente podrás personalizar tu perfil, preferencias de notificaciones y más.
            </p>
        </div>
    </div>
);

export default ConfiguracionSection;
