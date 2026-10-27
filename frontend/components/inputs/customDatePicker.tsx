"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { useFormContext } from "react-hook-form";

interface CustomDatePickerProps {
  fieldTitle: string;
  nameInSchema: string;
  disabled?: boolean;
  placeholder?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  fieldTitle,
  nameInSchema,
  disabled = false,
  placeholder = "Pick a date",
}) => {
  const form = useFormContext();
  return (
    <FormField
      control={form?.control}
      name={nameInSchema}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{fieldTitle}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                {field.value ? format(field.value, "PPP") : placeholder}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={disabled}
                captionLayout="dropdown"
                endMonth={new Date(2010, 11)}
                startMonth={new Date(1900, 0)}
                autoFocus
                classNames={{
                  hidden: "invisible",
                  dropdown:
                    "px-2 py-1.5 rounded-md bg-popover text-popover-foreground text-sm  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                  dropdowns: "flex gap-3",
                  caption_label: "hidden",
                }}
              />
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  );
};

export default CustomDatePicker;
