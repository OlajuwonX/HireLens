import { Input, type InputProps } from "./input";

export function DatePicker(props: Omit<InputProps, "type">) {
  return <Input type="date" {...props} />;
}
