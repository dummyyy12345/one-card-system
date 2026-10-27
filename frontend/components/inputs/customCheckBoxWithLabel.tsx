import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  fieldTitle: string;
  currentId: number;
  nameInSchema: string;
  message: string;
  disabled?: boolean;
  className?: string;
};

export default function CustomCheckBoxWithLabel({
  fieldTitle,
  currentId,
  nameInSchema,
  message,
  disabled = false,
  className,
}: Props) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={nameInSchema}
      render={({ field }) => (
        <FormItem
          className={`flex flex-row items-center space-x-4 rounded-md border px-4 py-2 ${className}`}
        >
          <FormControl>
            <Checkbox
              id={`${nameInSchema}-${currentId}`}
              checked={(field.value ?? []).includes(currentId)}
              onCheckedChange={(checked) => {
                field.onChange(
                  checked
                    ? [...(field.value ?? []), currentId]
                    : (field.value ?? []).filter(
                        (id: number) => id !== currentId
                      )
                );
              }}
              disabled={disabled}
            />
          </FormControl>
          <div>
            <FormLabel htmlFor={`${nameInSchema}-${currentId}`}>
              {fieldTitle}
            </FormLabel>
            <p>{message}</p>
          </div>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
