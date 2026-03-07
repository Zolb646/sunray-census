"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
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
  placeholder = "Pick a date range",
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
  });

  React.useEffect(() => {
    setDateRange(value ?? undefined);
  }, [value]);

  function handleSelect(range: DateRange | undefined) {
    setDateRange(range);
    if (onChange) onChange(range);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            type="button"
            variant="outline"
            className={cn(
              "w-[320px] justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground",
            )}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "d MMMM yyyy")} -{" "}
                  {format(dateRange.to, "d MMMM yyyy")}
                </>
              ) : (
                format(dateRange.from, "d MMMM yyyy")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
