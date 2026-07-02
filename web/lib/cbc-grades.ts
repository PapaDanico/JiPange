/**
 * Kenya's Competency-Based Curriculum (CBC) structure: 2 years pre-primary,
 * 6 years primary, 3 years junior secondary, 3 years senior secondary — the
 * "6-year CBC high school" is junior + senior secondary combined, replacing
 * the old 8-4-4 system's 4-year secondary school.
 *
 * Each grade's yearsToJSS/yearsToSSS is the number of years from now until
 * that transition begins. 0 means the child has already reached (or passed)
 * that phase, so there's no future lump sum left to save toward for it.
 */
export interface CbcGrade {
  value: string;
  label: string;
  yearsToJSS: number;
  yearsToSSS: number;
}

export const CBC_GRADES: readonly CbcGrade[] = [
  { value: "pp1", label: "Pre-Primary 1 (PP1)", yearsToJSS: 8, yearsToSSS: 11 },
  { value: "pp2", label: "Pre-Primary 2 (PP2)", yearsToJSS: 7, yearsToSSS: 10 },
  { value: "grade1", label: "Grade 1", yearsToJSS: 6, yearsToSSS: 9 },
  { value: "grade2", label: "Grade 2", yearsToJSS: 5, yearsToSSS: 8 },
  { value: "grade3", label: "Grade 3", yearsToJSS: 4, yearsToSSS: 7 },
  { value: "grade4", label: "Grade 4", yearsToJSS: 3, yearsToSSS: 6 },
  { value: "grade5", label: "Grade 5", yearsToJSS: 2, yearsToSSS: 5 },
  { value: "grade6", label: "Grade 6", yearsToJSS: 1, yearsToSSS: 4 },
  { value: "grade7", label: "Grade 7 (Junior Secondary)", yearsToJSS: 0, yearsToSSS: 3 },
  { value: "grade8", label: "Grade 8 (Junior Secondary)", yearsToJSS: 0, yearsToSSS: 2 },
  { value: "grade9", label: "Grade 9 (Junior Secondary)", yearsToJSS: 0, yearsToSSS: 1 },
  { value: "grade10", label: "Grade 10 (Senior Secondary)", yearsToJSS: 0, yearsToSSS: 0 },
  { value: "grade11", label: "Grade 11 (Senior Secondary)", yearsToJSS: 0, yearsToSSS: 0 },
  { value: "grade12", label: "Grade 12 (Senior Secondary)", yearsToJSS: 0, yearsToSSS: 0 },
];

export function getCbcGrade(value: string): CbcGrade | undefined {
  return CBC_GRADES.find((grade) => grade.value === value);
}
