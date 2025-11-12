import { useState, useCallback } from "react";

export function useControllableState<T>({
  defaultValue,
  value: controlledValue,
  onChange,
}: {
  defaultValue?: T;
  value?: T;
  onChange?: (value: T) => void;
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const setValue = useCallback(
    (nextValue: T) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  return [value, setValue] as const;
}
