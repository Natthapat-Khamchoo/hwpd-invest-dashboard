import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const MultiSelectDropdown = ({ options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleOption = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white cursor-pointer truncate h-[38px] flex items-center"
            >
                {selected.length === 0 ? <span className="text-slate-500">ทั้งหมด</span> :
                    selected.length === 1 ? selected[0] :
                        `${selected.length} ประเภท`}
                <div className="absolute right-2 top-2.5 text-slate-400 pointer-events-none">▼</div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => toggleOption(opt)}
                            className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                        >
                            <span>{opt}</span>
                            {selected.includes(opt) && <Check className="w-4 h-4 text-green-400" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
