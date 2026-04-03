import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Calendar from 'react-calendar';
import { IoCalendarOutline } from 'react-icons/io5';

const toDate = (str) => (str ? new Date(str + 'T12:00:00') : null);
const toStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const DateInput = ({ value, onChange, min, disabled, error }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef(null);
    const calendarRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                calendarRef.current && !calendarRef.current.contains(e.target)
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
        const calHeight = 320;
        const top = spaceBelow >= calHeight
            ? rect.bottom + window.scrollY + 8
            : rect.top + window.scrollY - calHeight - 8;
        setPos({ top, left: rect.left + window.scrollX, width: rect.width });
        setOpen((o) => !o);
    };

    const handleChange = (date) => {
        onChange(toStr(date));
        setOpen(false);
    };

    const display = value
        ? new Date(value + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Selecciona una fecha';

    const borderClass = error
        ? 'border-red-400 bg-red-50'
        : open
            ? 'border-[#5B7B7A] bg-white'
            : 'border-[#CEB5A7]/40 bg-white hover:border-[#5B7B7A]/50';

    const calendarStyles = `
        .di-cal { width: 100%; }
        .di-cal .react-calendar__navigation { display: flex; align-items: center; padding: 0.75rem 0.75rem 0.25rem; gap: 4px; }
        .di-cal .react-calendar__navigation button { background: none; border: none; cursor: pointer; border-radius: 0.5rem; padding: 0.4rem 0.6rem; font-weight: 600; color: #5B7B7A; transition: background 0.15s; }
        .di-cal .react-calendar__navigation button:hover { background: #E0F2E9; }
        .di-cal .react-calendar__navigation__label { flex: 1; font-size: 0.875rem; font-weight: 700; color: #5B7B7A; }
        .di-cal .react-calendar__month-view__weekdays { padding: 0 0.5rem; }
        .di-cal .react-calendar__month-view__weekdays__weekday { text-align: center; font-size: 0.65rem; font-weight: 700; color: #A17C6B; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0; }
        .di-cal .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
        .di-cal .react-calendar__month-view__days { padding: 0 0.5rem 0.75rem; }
        .di-cal .react-calendar__tile { background: none; border: 2px solid transparent; cursor: pointer; border-radius: 0.5rem; padding: 0.4rem; font-size: 0.8rem; font-weight: 500; color: #3D5A59; transition: background 0.15s; min-width: 2.25rem; }
        .di-cal .react-calendar__tile:hover:not(:disabled) { background: #E0F2E9; border-color: #CEB5A7; }
        .di-cal .react-calendar__tile--now { background: #E0F2E9; font-weight: 700; }
        .di-cal .react-calendar__tile--active { background: linear-gradient(135deg, #5B7B7A, #A17C6B) !important; color: white !important; border-color: transparent !important; }
        .di-cal .react-calendar__tile:disabled { color: #CEB5A7; cursor: not-allowed; opacity: 0.4; }
        .di-cal .react-calendar__month-view__days__day--neighboringMonth { color: #CEB5A7; opacity: 0.5; }
        .di-cal .react-calendar__year-view .react-calendar__tile,
        .di-cal .react-calendar__decade-view .react-calendar__tile { padding: 0.6rem; }
    `;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={handleOpen}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-colors text-left ${borderClass} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={value ? 'text-[#3D5A59]' : 'text-[#CEB5A7]'}>{display}</span>
                <IoCalendarOutline className="w-4 h-4 text-[#A17C6B] shrink-0 ml-2" />
            </button>

            {open && ReactDOM.createPortal(
                <div
                    ref={calendarRef}
                    style={{ position: 'absolute', top: pos.top, left: pos.left, width: Math.max(pos.width, 280), zIndex: 9999 }}
                    className="bg-white rounded-2xl shadow-xl border-2 border-[#CEB5A7]/40 overflow-hidden"
                >
                    <style>{calendarStyles}</style>
                    <Calendar
                        className="di-cal"
                        value={toDate(value)}
                        onChange={handleChange}
                        minDate={min ? toDate(min) : undefined}
                        locale="es-ES"
                    />
                </div>,
                document.body
            )}
        </>
    );
};

export default DateInput;
