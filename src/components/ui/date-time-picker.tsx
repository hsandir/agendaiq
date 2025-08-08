"use client";

import { useState, useEffect } from "react";
import { format, parse, isValid, addMinutes, setHours, setMinutes, startOfDay, addDays } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  id?: string;
}

const popularTimes = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00"
];

const quickDateOptions = [
  { label: "Today", getValue: () => startOfDay(new Date()) },
  { label: "Tomorrow", getValue: () => startOfDay(addDays(new Date(), 1)) },
  { label: "Next Monday", getValue: () => {
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    return startOfDay(addDays(today, daysUntilMonday));
  }},
  { label: "Next Week", getValue: () => startOfDay(addDays(new Date(), 7)) },
];

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select date and time",
  required = false,
  minDate,
  maxDate,
  className,
  id
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customTime, setCustomTime] = useState("");

  useEffect(() => {
    if (value) {
      try {
        const dateTime = new Date(value);
        if (isValid(dateTime)) {
          setSelectedDate(format(dateTime, "yyyy-MM-dd"));
          setSelectedTime(format(dateTime, "HH:mm"));
          setCustomTime(format(dateTime, "HH:mm"));
        }
      } catch (e) {
        console.error("Invalid date value:", value);
      }
    }
  }, [value]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    updateDateTime(date, selectedTime || "09:00");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCustomTime(time);
    updateDateTime(selectedDate || format(new Date(), "yyyy-MM-dd"), time);
  };

  const handleCustomTimeChange = (time: string) => {
    setCustomTime(time);
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setSelectedTime(time);
      updateDateTime(selectedDate || format(new Date(), "yyyy-MM-dd"), time);
    }
  };

  const handleQuickDateSelect = (getValue: () => Date) => {
    const date = getValue();
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    updateDateTime(dateStr, selectedTime || "09:00");
  };

  const updateDateTime = (date: string, time: string) => {
    if (date && time) {
      const dateTimeString = `${date}T${time}`;
      onChange(dateTimeString);
    }
  };

  const getDisplayValue = () => {
    if (!value) return "";
    try {
      const dateTime = new Date(value);
      if (isValid(dateTime)) {
        return format(dateTime, "MMM dd, yyyy 'at' HH:mm");
      }
    } catch (e) {
      return "";
    }
    return "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {getDisplayValue() || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Quick Date Selection */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Select</Label>
              <div className="grid grid-cols-2 gap-1">
                {quickDateOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => handleQuickDateSelect(option.getValue)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Input */}
            <div>
              <Label htmlFor="date-input" className="text-xs text-muted-foreground">
                Select Date
              </Label>
              <Input
                id="date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
                max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
                className="mt-1"
              />
            </div>

            {/* Popular Times */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                <Clock className="inline h-3 w-3 mr-1" />
                Popular Times
              </Label>
              <div className="grid grid-cols-4 gap-1">
                {popularTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "ghost"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Time Input */}
            <div>
              <Label htmlFor="time-input" className="text-xs text-muted-foreground">
                Or Enter Custom Time
              </Label>
              <Input
                id="time-input"
                type="time"
                value={customTime}
                onChange={(e) => handleCustomTimeChange(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Current Selection Display */}
            {selectedDate && selectedTime && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium">
                  Selected: {format(new Date(`${selectedDate}T${selectedTime}`), "MMM dd, yyyy 'at' HH:mm")}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}