import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Shift } from "@/types/production";

interface ShiftSelectorProps {
  shifts: Shift[];
  selectedShift: string;
  onShiftChange: (shiftId: string) => void;
}

export function ShiftSelector({ shifts, selectedShift, onShiftChange }: ShiftSelectorProps) {
  return (
    <Tabs value={selectedShift} onValueChange={onShiftChange}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All Shifts</TabsTrigger>
        {shifts.map((shift) => (
          <TabsTrigger key={shift.id} value={shift.id}>
            {shift.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
