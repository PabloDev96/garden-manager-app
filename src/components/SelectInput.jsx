import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IoChevronDownOutline, IoCheckmarkOutline } from 'react-icons/io5';

const SelectInput = ({ value, onChange, options = [], placeholder, disabled, error }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        if (disabled) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const maxDropdownHeight = 240;
        const top = spaceBelow >= maxDropdownHeight
            ? rect.bottom + window.scrollY + 4
            : rect.top + window.scrollY - maxDropdownHeight - 4;
        setPos({ top, left: rect.left + window.scrollX, width: rect.width });
        setOpen((o) => !o);
    };

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
    };

    const selected = options.find((o) => o.value === value);
    const displayLabel = selected ? selected.label : placeholder ?? 'Selecciona una opción';
    const hasValue = !!selected;

    const borderClass = error
        ? 'border-red-400 bg-red-50'
        : open
            ? 'border-[#5B7B7A] bg-white'
            : 'border-[#CEB5A7]/40 bg-white hover:border-[#5B7B7A]/50';

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={handleOpen}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-colors text-left ${borderClass} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={hasValue ? 'text-[#3D5A59]' : 'text-[#CEB5A7]'}>{displayLabel}</span>
                <IoChevronDownOutline
                    className={`w-4 h-4 text-[#A17C6B] shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && ReactDOM.createPortal(
                <div
                    ref={dropdownRef}
                    style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-white rounded-2xl shadow-xl border-2 border-[#CEB5A7]/40 overflow-hidden"
                >
                    <ul className="max-h-60 overflow-y-auto py-1.5">
                        {options.map((opt) => (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    onMouseDown={() => handleSelect(opt.value)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer
                                        ${opt.value === value
                                            ? 'bg-[#E0F2E9] text-[#3D5A59] font-semibold'
                                            : 'text-[#3D5A59] hover:bg-[#E0F2E9]/60'
                                        }`}
                                >
                                    <span>{opt.label}</span>
                                    {opt.value === value && (
                                        <IoCheckmarkOutline className="w-4 h-4 text-[#5B7B7A] shrink-0" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>,
                document.body
            )}
        </>
    );
};

export default SelectInput;
