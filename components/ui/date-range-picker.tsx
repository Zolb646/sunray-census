"use client";

import * as React from "react";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  numberOfMonths?: number;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Огнооны хүрээ сонгох",
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    value,
  );

  React.useEffect(() => {
    setInternalDate(value);
  }, [value]);

  function handleSelect(range: DateRange | undefined) {
    setInternalDate(range);
    onChange?.(range);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-84 justify-start rounded-full text-left font-normal",
              !internalDate?.from && "text-muted-foreground",
            )}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate?.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, "d MMMM yyyy", { locale: mn })} -{" "}
                  {format(internalDate.to, "d MMMM yyyy", { locale: mn })}
                </>
              ) : (
                format(internalDate.from, "d MMMM yyyy", { locale: mn })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
