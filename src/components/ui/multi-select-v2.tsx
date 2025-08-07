"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
  department?: string;
  role?: string;
  email?: string;
  avatar?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  maxHeight?: string;
  showSearch?: boolean;
  showDepartmentFilter?: boolean;
  showRoleFilter?: boolean;
  departments?: string[];
  roles?: string[];
}

export function MultiSelectV2({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  label,
  required = false,
  className,
  maxHeight = "300px",
  showSearch = true,
  showDepartmentFilter = false,
  showRoleFilter = false,
  departments = [],
  roles = [],
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) => {
      const matchesSearch = 
        !searchQuery ||
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.email && option.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesDepartment = 
        !showDepartmentFilter ||
        departmentFilter === "all" ||
        option.department === departmentFilter;
      
      const matchesRole = 
        !showRoleFilter ||
        roleFilter === "all" ||
        option.role === roleFilter;
      
      return matchesSearch && matchesDepartment && matchesRole;
    });
  }, [options, searchQuery, departmentFilter, roleFilter, showDepartmentFilter, showRoleFilter]);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
    
    // Reset filters after selection to show all options again
    setSearchQuery("");
    setDepartmentFilter("all");
    setRoleFilter("all");
  };

  const handleRemove = (value: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(selected.filter((item) => item !== value));
  };

  const handleSelectAll = () => {
    const allValues = filteredOptions.map((option) => option.value);
    onChange(allValues);
    
    // Reset filters after selecting all
    setSearchQuery("");
    setDepartmentFilter("all");
    setRoleFilter("all");
  };

  const handleClearAll = () => {
    onChange([]);
    
    // Reset filters after clearing all
    setSearchQuery("");
    setDepartmentFilter("all");
    setRoleFilter("all");
  };

  const selectedOptions = options.filter((option) =>
    selected.includes(option.value)
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      {/* Selected items display - Outside the popover trigger */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="gap-1">
              {option.label}
              <button
                type="button"
                onClick={(e) => handleRemove(option.value, e)}
                className="ml-1 rounded-full outline-none hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className={cn(
              "text-left",
              selected.length === 0 && "text-muted-foreground"
            )}>
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2 border-b space-y-2">
            {/* Search */}
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            )}

            {/* Filters */}
            {(showDepartmentFilter || showRoleFilter) && (
              <div className="flex gap-2">
                {showDepartmentFilter && departments.length > 0 && (
                  <select
                    className="flex-1 text-sm border rounded px-2 py-1"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                )}
                {showRoleFilter && roles.length > 0 && (
                  <select
                    className="flex-1 text-sm border rounded px-2 py-1"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                Select All ({filteredOptions.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Options List */}
          <div
            className="overflow-auto p-1"
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    selected.includes(option.value) && "bg-accent"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.email && (
                      <div className="text-xs text-muted-foreground">{option.email}</div>
                    )}
                    {(option.department || option.role) && (
                      <div className="flex gap-2 mt-1">
                        {option.department && (
                          <Badge variant="outline" className="text-xs">
                            {option.department}
                          </Badge>
                        )}
                        {option.role && (
                          <Badge variant="outline" className="text-xs">
                            {option.role}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Count */}
          {selected.length > 0 && (
            <div className="border-t p-2">
              <div className="text-xs text-muted-foreground">
                {selected.length} of {options.length} selected
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}