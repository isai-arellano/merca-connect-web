"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DaySchedule {
    open: boolean;
    from_: string;
    to: string;
}

export interface WeekSchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

export const EMPTY_WEEK_SCHEDULE: WeekSchedule = {
    monday:    { open: false, from_: "", to: "" },
    tuesday:   { open: false, from_: "", to: "" },
    wednesday: { open: false, from_: "", to: "" },
    thursday:  { open: false, from_: "", to: "" },
    friday:    { open: false, from_: "", to: "" },
    saturday:  { open: false, from_: "", to: "" },
    sunday:    { open: false, from_: "", to: "" },
};

const DAY_LABELS: Record<keyof WeekSchedule, string> = {
    monday:    "Lunes",
    tuesday:   "Martes",
    wednesday: "Miércoles",
    thursday:  "Jueves",
    friday:    "Viernes",
    saturday:  "Sábado",
    sunday:    "Domingo",
};

const DAY_ORDER: (keyof WeekSchedule)[] = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

interface HoursEditorProps {
    value: WeekSchedule;
    onChange: (value: WeekSchedule) => void;
}

function isDayIncomplete(schedule: DaySchedule): boolean {
    return schedule.open && (!schedule.from_ || !schedule.to);
}

export function hasIncompleteHours(schedule: WeekSchedule): boolean {
    return DAY_ORDER.some((day) => isDayIncomplete(schedule[day]));
}

export function HoursEditor({ value, onChange }: HoursEditorProps) {
    function updateDay(day: keyof WeekSchedule, patch: Partial<DaySchedule>) {
        onChange({ ...value, [day]: { ...value[day], ...patch } });
    }

    return (
        <div className="space-y-2">
            {DAY_ORDER.map((day) => {
                const schedule = value[day];
                const incomplete = isDayIncomplete(schedule);
                return (
                    <div key={day} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                        {/* Toggle activo/inactivo */}
                        <div className="flex items-center gap-2 w-32 shrink-0">
                            <Switch
                                id={`hours-${day}`}
                                checked={schedule.open}
                                onCheckedChange={(checked) => updateDay(day, { open: checked })}
                            />
                            <Label
                                htmlFor={`hours-${day}`}
                                className={`text-sm font-medium cursor-pointer ${schedule.open ? "text-foreground" : "text-muted-foreground"}`}
                            >
                                {DAY_LABELS[day]}
                            </Label>
                        </div>

                        {schedule.open ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    type="time"
                                    value={schedule.from_}
                                    onChange={(e) => updateDay(day, { from_: e.target.value })}
                                    className={`h-8 w-32 text-sm ${incomplete && !schedule.from_ ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    required
                                />
                                <span className="text-muted-foreground text-sm shrink-0">a</span>
                                <Input
                                    type="time"
                                    value={schedule.to}
                                    onChange={(e) => updateDay(day, { to: e.target.value })}
                                    className={`h-8 w-32 text-sm ${incomplete && !schedule.to ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                    required
                                />
                                {incomplete && (
                                    <span className="text-xs text-destructive shrink-0">Hora requerida</span>
                                )}
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground italic flex-1">Cerrado</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
