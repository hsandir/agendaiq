"use client";

import { useState, useEffect, useRef } from "react";
import { format, parse, isValid, addMinutes, setHours, setMinutes, startOfDay, addDays } from "date-fns";
import { Calendar, Clock, Check } from "lucide-react";
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
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
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
  
  // Default values: today's date and 08:00 AM
  const getDefaultDate = () => format(new Date(), "yyyy-MM-dd");
  const getDefaultTime = () => "08:00";
  
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [selectedTime, setSelectedTime] = useState(getDefaultTime());
  const [customTime, setCustomTime] = useState(getDefaultTime());
  
  // Temp states - used while popover is open
  const [tempDate, setTempDate] = useState(selectedDate);
  const [tempTime, setTempTime] = useState(selectedTime);

  // Set default value on initial load
  useEffect(() => {
    if (!value) {
      // If no value, send default to parent
      const defaultDateTime = `${getDefaultDate()}T${getDefaultTime()}`;
      console.log("Setting default date/time:", defaultDateTime);
      onChange(defaultDateTime);
    } else {
      try {
        const dateTime = new Date(value);
        if (isValid(dateTime)) {
          const dateStr = format(dateTime, "yyyy-MM-dd");
          const timeStr = format(dateTime, "HH:mm");
          setSelectedDate(dateStr);
          setSelectedTime(timeStr);
          setCustomTime(timeStr);
          setTempDate(dateStr);
          setTempTime(timeStr);
        }
      } catch (e: unknown) {
        console.error("Invalid date value:", value);
        // Use default if value is invalid
        const defaultDateTime = `${getDefaultDate()}T${getDefaultTime()}`;
        onChange(defaultDateTime);
      }
    }
  }, []);

  // When popover opens, update temp values
  const handlePopoverOpenChange = (open: boolean) => {
    if (open) {
      // Popover is opening, copy current values to temp
      setTempDate(selectedDate);
      setTempTime(selectedTime);
    }
    setIsOpen(open);
  };

  // When date changes (inside popover)
  const handleDateChange = (date: string) => {
    setTempDate(date)
  };

  // When time is selected (inside popover)
  const handleTimeSelect = (time: string) => {
    setTempTime(time);
    setCustomTime(time);
  };

  // When manual time is entered (inside popover)
  const handleCustomTimeChange = (time: string) => {
    setCustomTime(time);
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setTempTime(time);
    }
  };

  // Quick date selection (inside popover)
  const handleQuickDateSelect = (getValue: () => Date) => {
    const date = getValue();
    const dateStr = format(date, "yyyy-MM-dd");
    setTempDate(dateStr);
  };

  // When Done button is clicked or popover closes
  const applyDateTime = () => {
    console.log("Applying date/time - Date:", tempDate, "Time:", tempTime);
    
    if (tempDate && tempTime) {
      setSelectedDate(tempDate);
      setSelectedTime(tempTime);
      
      const dateTimeString = `${tempDate}T${tempTime}`;
      console.log("DateTimePicker updating value to:", dateTimeString);
      onChange(dateTimeString);
      setIsOpen(false);
    }
  };

  // When Cancel button is clicked
  const cancelSelection = () => {
    // Restore temp values to previous state
    setTempDate(selectedDate);
    setTempTime(selectedTime);
    setCustomTime(selectedTime);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    // Always show selected date and time, even if not in value prop yet
    if (selectedDate && selectedTime) {
      try {
        const dateTime = new Date(`${selectedDate}T${selectedTime}`);
        if (isValid(dateTime)) {
          return format(dateTime, "MMM dd, yyyy 'at' HH:mm")
        }
      } catch (e: unknown) {
        return ""
      }
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
      
      <Popover open={isOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && !selectedTime && "text-muted-foreground"
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
                value={tempDate}
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
                    variant={tempTime === time ? "default" : "ghost"}
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
            {tempDate && tempTime && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium">
                  Selected: {format(new Date(`${tempDate}T${tempTime}`), "MMM dd, yyyy 'at' HH:mm")}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelSelection}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={applyDateTime}
                disabled={!tempDate || !tempTime}
              >
                <Check className="h-4 w-4 mr-1" />
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}