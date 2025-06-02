// components/ui/combobox.tsx
'use client'

import { useState } from 'react'
import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

export function Combobox({
    options,
    value,
    onChange,
    onSearch,
    placeholder,
    searchText,
}: {
    options: { value: string; label: string }[]
    value: string
    onChange: (value: string) => void
    onSearch: (term: string) => void
    placeholder?: string
    searchText: string
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative">
            <Command>
                <CommandInput
                    placeholder={placeholder}
                    value={searchText}
                    onValueChange={(term) => {
                        onSearch(term)
                        setOpen(term.length > 0)
                    }}
                    onFocus={() => setOpen(true)}
                />
                {open && (
                    <CommandList className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                    onChange(option.value)
                                    setOpen(false)
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandList>
                )}
            </Command>
        </div>
    )
}