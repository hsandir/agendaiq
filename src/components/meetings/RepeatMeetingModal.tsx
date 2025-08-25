"use client";

import { useState, useEffect } from "react";
import { format, addDays, addWeeks, addMonths, startOfMonth, getDay, setDay, eachDayOfInterval, isSameDay } from "date-fns";
import { safeFormat, safeParseDate, isValidDateValue } from '@/lib/utils/safe-format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Calendar, CalendarDays, Clock, Repeat, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface RepeatConfig {
  enabled: boolean;
  pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number; // For custom intervals
  weekDays?: number[]; // 0-6 (Sunday-Saturday)
  monthDay?: number; // 1-31
  monthWeek?: number; // 1-4 (first, second, third, fourth week)
  monthWeekDay?: number; // 0-6 (day of week for monthly "first Monday" etc)
  endType: 'never' | 'after' | 'by';
  occurrences?: number; // Number of occurrences if endType is 'after'
  endDate?: string; // End date if endType is 'by'
  includeAgenda: boolean; // Whether to copy agenda to all meetings
  exceptions?: string[]; // Dates to skip (holidays, etc)
}
interface RepeatMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onConfirm: (config: RepeatConfig) => void
}
const WEEKDAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
];

const MONTH_WEEKS = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
];

export function RepeatMeetingModal({ 
  isOpen, 
  onClose, 
  startDate, 
  endDate,
  onConfirm 
}: RepeatMeetingModalProps) {
  const [config, setConfig] = useState<RepeatConfig>({
    enabled: true,
    pattern: 'weekly',
    interval: 1,
    weekDays: [getDay(new Date(startDate))],
    endType: 'after',
    occurrences: 10,
    includeAgenda: true,
    exceptions: [],
  });

  const [selectedExceptionDates, setSelectedExceptionDates] = useState<string[]>([]);
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate preview dates whenever config changes
  useEffect(() => {
    if (config.enabled) {
      const dates = calculateMeetingDates(startDate, config);
      setPreviewDates(dates.slice(0, 10)); // Show first 10 occurrences
    }
  }, [config, startDate]);

  const calculateMeetingDates = (start: string, conf: RepeatConfig): Date[] => {
    const dates: Date[] = [];
    
    // Validate start date
    if (!start) return dates;
    
    let currentDate: Date;
    try {
      currentDate = new Date(start);
      if (isNaN(currentDate.getTime())) {
        console.error('Invalid start date:', start);
        return dates;
      }
    } catch (error: unknown) {
      console.error('Error parsing start date:', error);
      return dates;
    }
    ;
    const maxDates = conf.endType === 'after' ? (conf.occurrences ?? 10) : 52; // Max 52 for preview
    let endDateLimit: Date | null = null;
    
    if (conf.endType === 'by' && conf.endDate) {
      try {
        endDateLimit = new Date(conf.endDate);
        if (isNaN(endDateLimit.getTime())) {
          endDateLimit = null;
        }
      } catch {
        endDateLimit = null;
      }
    }
    for (let i = 0; i < maxDates; i++) {
      if (endDateLimit && currentDate > endDateLimit) break;

      // Skip if date is in exceptions
      const isException = conf.exceptions?.some(ex => {
        try {
          const exDate = new Date(ex);
          return !isNaN(exDate.getTime()) && isSameDay(exDate, currentDate);
        } catch {
          return false;
        }
      });
      
      if (!isException) {
        dates.push(new Date(currentDate));
      }
      // Calculate next date based on pattern
      switch (conf.pattern) {
        case 'daily':
          currentDate = addDays(currentDate, conf.interval ?? 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          if (conf.monthDay) {
            currentDate = addMonths(currentDate, 1);
            currentDate.setDate(Math.min(conf.monthDay, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()));
          } else if (conf.monthWeek && conf.monthWeekDay !== undefined) {
            currentDate = getMonthlyWeekdayDate(currentDate, conf.monthWeek, conf.monthWeekDay);
          } else {
            currentDate = addMonths(currentDate, 1);
          }
          break;
        case 'custom':
          if (conf.weekDays && conf.weekDays.length > 0) {
            // Find next occurrence of selected weekdays
            let found = false;
            for (let j = 1; j <= 7; j++) {
              const nextDate = addDays(currentDate, j);
              if (conf.weekDays.includes(getDay(nextDate))) {
                currentDate = nextDate;
                found = true;
                break;
              }
            }
            if (!found) currentDate = addWeeks(currentDate, 1);
          } else {
            currentDate = addDays(currentDate, conf.interval ?? 1);
          }
          break;
      }
    }
    return dates;
  }
  const getMonthlyWeekdayDate = (date: Date, week: number, weekday: number): Date => {
    const nextMonth = addMonths(date, 1);
    const firstDay = startOfMonth(nextMonth);
    
    if (week === -1) {
      // Last occurrence of weekday in month
      const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
      for (let d = lastDay; d >= firstDay; d = addDays(d, -1)) {
        if (getDay(d) === weekday) return d;
      }
    } else {
      // Nth occurrence of weekday in month
      let count = 0;
      for (let d = firstDay; d.getMonth() === nextMonth.getMonth(); d = addDays(d, 1)) {
        if (getDay(d) === weekday) {
          count++;
          if (count === week) return d;
        }
      }
    }
    
    return nextMonth;
  }
  const handleConfirm = () => {
    onConfirm({
      ...config,
      exceptions: selectedExceptionDates,
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Configure Repeat Meeting
          </DialogTitle>
          <DialogDescription>
            Set up a recurring meeting series with flexible scheduling options
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 pr-4">
            {/* Pattern Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Repeat Pattern</Label>
              <RadioGroup
                value={config.pattern}
                onValueChange={(value) => setConfig({ ...config, pattern: value as RepeatConfig['pattern'] })}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="cursor-pointer flex-1">
                      <div className="font-medium">Daily</div>
                      <div className="text-xs text-muted-foreground">Every day</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="cursor-pointer flex-1">
                      <div className="font-medium">Weekly</div>
                      <div className="text-xs text-muted-foreground">Same day every week</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted">
                    <RadioGroupItem value="biweekly" id="biweekly" />
                    <Label htmlFor="biweekly" className="cursor-pointer flex-1">
                      <div className="font-medium">Bi-weekly</div>
                      <div className="text-xs text-muted-foreground">Every two weeks</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer flex-1">
                      <div className="font-medium">Monthly</div>
                      <div className="text-xs text-muted-foreground">Same date every month</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted col-span-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer flex-1">
                      <div className="font-medium">Custom</div>
                      <div className="text-xs text-muted-foreground">Select specific days and intervals</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Custom Pattern Options */}
            {config.pattern === 'custom' && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="interval">Repeat every</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      max="99"
                      value={config.interval}
                      onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) ?? 1 })}
                      className="w-20"
                    />
                    <span>day(s)</span>
                  </div>
                </div>
                
                <div>
                  <Label>On these days</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {WEEKDAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={config.weekDays?.includes(day.value) ?? false}
                          onCheckedChange={(checked) => {
                            const days = config.weekDays ?? [];
                            setConfig({
                              ...config,
                              weekDays: checked
                                ? [...days, day.value]
                                : days.filter(d => d !== day.value);
                            });
                          }}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                          {day.short}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Pattern Options */}
            {config.pattern === 'monthly' && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <RadioGroup
                  value={config.monthDay ? 'day' : 'weekday'}
                  onValueChange={(value) => {
                    if (value === 'day') {
                      setConfig({ 
                        ...config, 
                        monthDay: new Date(startDate).getDate(),
                        monthWeek: undefined,
                        monthWeekDay: undefined
                      });
                    } else {
                      const date = new Date(startDate);
                      setConfig({ 
                        ...config, 
                        monthDay: undefined,
                        monthWeek: Math.ceil(date.getDate() / 7),
                        monthWeekDay: getDay(date)
                      });
                    }
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="day" id="month-day" />
                      <Label htmlFor="month-day" className="cursor-pointer">
                        On day {config.monthDay ?? new Date(startDate).getDate()} of every month
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekday" id="month-weekday" />
                      <Label htmlFor="month-weekday" className="cursor-pointer flex items-center gap-2">
                        On the
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={config.monthWeek ?? 1}
                          onChange={(e) => setConfig({ ...config, monthWeek: parseInt(e.target.value) })}
                        >
                          {MONTH_WEEKS.map(week => (
                            <option key={week.value} value={week.value}>{week.label}</option>
                          ))}
                        </select>
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={config.monthWeekDay ?? 0}
                          onChange={(e) => setConfig({ ...config, monthWeekDay: parseInt(e.target.value) })}
                        >
                          {WEEKDAYS.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                          ))}
                        </select>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* End Date Configuration */}
            <div>
              <Label className="text-base font-semibold mb-3 block">End Date</Label>
              <RadioGroup
                value={config.endType}
                onValueChange={(value) => setConfig({ ...config, endType: value as RepeatConfig['endType'] })}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="never" />
                    <Label htmlFor="never" className="cursor-pointer">No end date</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="after" id="after" />
                    <Label htmlFor="after" className="cursor-pointer flex items-center gap-2">
                      After
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={config.occurrences ?? 10}
                        onChange={(e) => setConfig({ ...config, occurrences: parseInt(e.target.value) ?? 10 })}
                        className="w-20"
                        disabled={config.endType !== 'after'}
                      />
                      occurrences
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="by" id="by" />
                    <Label htmlFor="by" className="cursor-pointer flex items-center gap-2">
                      By
                      <Input
                        type="date"
                        value={config.endDate ?? ''}
                        onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                        className="w-40"
                        disabled={config.endType !== 'by'}
                        min={startDate.split('T')[0]}
                      />
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Agenda Options */}
            <div className="flex items-center justify-between p-4 bg-primary rounded-lg">
              <div>
                <Label htmlFor="include-agenda" className="font-medium">Copy agenda to all meetings</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the same agenda items for all meetings in the series
                </p>
              </div>
              <Switch
                id="include-agenda"
                checked={config.includeAgenda}
                onCheckedChange={(checked) => setConfig({ ...config, includeAgenda: checked })}
              />
            </div>

            {/* Advanced Options */}
            <div>
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </Button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label>Exclude dates (holidays, etc.)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Select dates to skip in the series</p>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        onChange={(e) => {
                          if (e.target.value && !selectedExceptionDates.includes(e.target.value)) {
                            setSelectedExceptionDates([...selectedExceptionDates, e.target.value]);
                          }
                        }}
                        min={startDate.split('T')[0]}
                      />
                    </div>
                    {selectedExceptionDates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedExceptionDates.map((date) => (
                          <Badge key={date} variant="secondary" className="gap-1">
                            {safeFormat(date, 'MMM dd, yyyy')}
                            <button
                              onClick={() => setSelectedExceptionDates(selectedExceptionDates.filter(d => d !== date))}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Preview (First 10 occurrences)
              </Label>
              <div className="p-4 bg-muted rounded-lg">
                {previewDates.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {previewDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>{safeFormat(date, 'EEE, MMM dd, yyyy')}</span>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">Original</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No meetings scheduled</p>
                )}
                {config.endType === 'never' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Series continues indefinitely...
                  </p>
                )}
                {config.endType === 'after' && config.occurrences && config.occurrences > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ...and {config.occurrences - 10} more meetings
                  </p>
                )}
              </div>
            </div>

            {/* Summary Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will create {
                  config.endType === 'never' ? 'an ongoing series' :
                  config.endType === 'after' ? `${config.occurrences} meetings` :
                  `meetings until ${safeFormat(config.endDate, 'MMM dd, yyyy', 'selected date')}`
                } starting from {safeFormat(startDate, 'MMM dd, yyyy', 'selected date')}.
                {config.includeAgenda ? ' All meetings will have the same agenda.' : ' Each meeting will have an empty agenda.'}
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Create Series ({previewDates.length} meetings)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}