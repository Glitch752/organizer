// I admit: this one was partially vibe-coded (blegh).
// I did NOT want to go through all that logic for a mediocre result anyway.

import { Temporal } from "@js-temporal/polyfill";

// TODO: Refactor this to a more generic system that can reuse code across these fuzzy matchers

export function parseFuzzyDate(input: string): {
    result?: Temporal.PlainDate;
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { explanation: 'empty or non-string input' };

    const months: Record<string, number> = {
        jan: 1, january: 1,
        feb: 2, february: 2,
        mar: 3, march: 3,
        apr: 4, april: 4,
        may: 5,
        jun: 6, june: 6,
        jul: 7, july: 7,
        aug: 8, august: 8,
        sep: 9, sept: 9, september: 9,
        oct: 10, october: 10,
        nov: 11, november: 11,
        dec: 12, december: 12
    };
    const weekdays: Record<string, number> = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2, tues: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4, thurs: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6
    };

    // Normalize
    let s: string = input.trim();
    let original: string = s;
    s = s.toLowerCase();

    // Reference date used for phrases like "thursday"
    const now = Temporal.Now.plainDateISO();

    // Quick Date parse. If valid, accept it (but set to midnight)
    try {
        return {
            result: Temporal.PlainDate.from(s, {
                overflow: "reject"
            }),
            explanation: 'Parsed by Temporal.ZonedDateTime.from / ISO parsing'
        };
    } catch { /* ignore */ }

    // Simple cleanup - remove time-related patterns and other noise
    s = s.replace(/,/g, ' ')
        .replace(/\b(st|nd|rd|th)\b/g, '')
        .replace(/[@\_\(\)]/g, ' ')
        .replace(/[\/\\]+/g, ' ')
        .replace(/[-]+/g, ' ')
        .replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/gi, '')
        .replace(/\b(\d{3,4})(am|pm)\b/gi, '')
        .replace(/\b(noon|midnight)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Keywords
    const kwToday: boolean = /\btoday\b/.test(s);
    const kwTomorrow: boolean = /\btomorrow\b/.test(s) || /\btmrw\b/.test(s);
    const kwYesterday: boolean = /\byesterday\b/.test(s);
    if(kwToday || kwTomorrow || kwYesterday) {
        let base = now;
        if(kwTomorrow) base = base.add({ days: 1 });
        if(kwYesterday) base = base.subtract({ days: 1 });
        return {
            result: base,
            explanation: kwToday ? 'Today' : kwTomorrow ? 'Tomorrow' : 'Yesterday'
        };
    }
    
    // Weekdays
    let targetWeekday: number | null = null;
    let foundWeekdayText: string | null = null;
    for(const w of Object.keys(weekdays)) {
        const rx = new RegExp('\\b' + w + '\\b');
        if(rx.test(s)) {
            targetWeekday = weekdays[w];
            foundWeekdayText = w;
            s = s.replace(rx, '').replace(/\s+/g, ' ').trim();
            break;
        }
    }

    // Months
    let foundMonth: number | null = null;
    for(const m of Object.keys(months)) {
        const rx = new RegExp('\\b' + m + '\\b');
        if(rx.test(s)) {
            foundMonth = months[m];
            s = s.replace(rx, '').replace(/\s+/g, ' ').trim();
            break;
        }
    }

    // Collect numeric tokens (years/days)
    const numbers: number[] = (s.match(/\d{1,4}/g) || []).map(n => parseInt(n, 10));

    // If the original had numeric-date separators like 8/27/25 or 2025-08-27
    const sepMatch: RegExpMatchArray | null = original.match(/^\s*(\d{1,4})[\/\-](\d{1,2})(?:[\/\-](\d{1,4}))?\s*$/);
    if(sepMatch && numbers.length >= 2) {
        const a: number = parseInt(sepMatch[1], 10);
        const b: number = parseInt(sepMatch[2], 10);
        const c: number | null = sepMatch[3] ? parseInt(sepMatch[3], 10) : null;
        let year: number | null = null, mon: number | null = null, day: number | null = null;
        if(c !== null) {
            if(a > 31) { year = a; mon = b; day = c; }
            else if(c > 31) { year = c; mon = a; day = b; }
            else {
                const preferDMY: boolean = guessDMYPreferred();
                if(preferDMY) { day = a; mon = b; year = c; }
                else { mon = a; day = b; year = c; }
            }
        } else {
            if(a > 12) { day = a; mon = b; year = now.year; }
            else { mon = a; day = b; year = now.year; }
        }
        if(year !== null && year < 100) year += 2000;
        if(year === null) year = now.year;
        return {
            result: Temporal.PlainDate.from({ year, month: mon, day }),
            explanation: `Parsed numeric-separated date (${original})`
        };
    }

    // Decide year/month/day using heuristics
    let year: number | null = null, day: number | null = null, monthIndex: number | null = foundMonth;

    // Extract explicit 4-digit year in numbers if present
    for(let i = 0; i < numbers.length; i++) {
        const n = numbers[i];
        if(n >= 1000) {
            year = n;
            numbers.splice(i, 1);
            break;
        }
    }
    // Extract two-digit year if obviously like a year (>= 32)
    for(let i = numbers.length - 1; i >= 0; i--) {
        const n = numbers[i];
        if(n >= 32) { year = n; numbers.splice(i, 1); break; }
    }

    // Interpret remaining numbers
    if(foundMonth !== null) {
        if(numbers.length === 0) {
            day = 1;
        } else if(numbers.length === 1) {
            const n = numbers[0];
            if((n > 31) || (n >= 100)) {
                year = n;
                day = 1;
            } else {
                day = n;
            }
        } else {
            let possibleYearIndex: number | null = null;
            for(let i = 0; i < numbers.length; i++) {
                const n = numbers[i];
                if(n > 31) { possibleYearIndex = i; break; }
            }
            if (possibleYearIndex !== null) {
                year = numbers.splice(possibleYearIndex, 1)[0];
                day = numbers[0];
            } else {
                if(numbers[1] && numbers[1] >= 0 && numbers[1] < 100) {
                    day = numbers[0];
                    year = numbers[1];
                } else {
                    day = numbers[0];
                }
            }
        }
    } else {
        if(targetWeekday !== null) {
            const ref = now;
            const target = targetWeekday;
            const daysAhead = (target - ref.dayOfWeek + 7) % 7 || 7;
            const chosen = ref.add({ days: daysAhead });
            return {
                result: chosen,
                explanation: `Next ${foundWeekdayText}`
            };
        } else {
            if(numbers.length === 1) {
                if(numbers[0] > 31) {
                    year = numbers[0];
                    monthIndex = 1; day = 1;
                } else {
                    day = numbers[0];
                    monthIndex = now.month;
                    year = now.year;
                }
            } else if(numbers.length >= 2) {
                const [a, b, c] = numbers;
                if(a > 31) {
                    year = a; monthIndex = (b ? b : now.month); day = c || 1;
                } else if(c && c > 31) {
                    year = c; monthIndex = a; day = b;
                } else {
                    monthIndex = a;
                    day = b;
                    if (c !== undefined) year = c;
                }
            } else {
                return {
                    result: now,
                    explanation: 'Fallback to today'
                };
            }
        }
    }

    if(year === null) year = now.year;
    if(year < 100) year += 2000;

    if(monthIndex === null) monthIndex = now.month;
    if(day === null) day = 1;

    let finalDate: Temporal.PlainDate;
    try {
        finalDate = Temporal.PlainDate.from({ year, month: monthIndex, day });
    } catch {
        return { explanation: 'Could not produce a valid date' };
    }

    if(targetWeekday !== null && foundMonth !== null) {
        const chosenWD = finalDate.dayOfWeek;
        if(chosenWD !== targetWeekday) {
            let attempt = finalDate;
            for(let i = 1; i <= 14; i++) {
                attempt = attempt.add({ days: 1 });
                if(attempt.dayOfWeek === targetWeekday) {
                    if(attempt.month === finalDate.month || attempt.year === finalDate.year) {
                        finalDate = attempt;
                        break;
                    }
                }
            }
        }
    }

    return {
        result: finalDate,
        explanation: `Parsed using heuristics (monthIndex=${monthIndex}, day=${day}, year=${year})`
    };
}

export function parseFuzzyTime(input: string): {
    result?: Temporal.PlainTime;
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { explanation: 'empty or non-string input' };
    
    let s: string = input.trim().toLowerCase();
    
    let hour: number | null = null, minute: number = 0, second: number = 0;
    let timeExplanation: string = '';
    
    // Named times
    if(/\bnoon\b/.test(s)) { 
        hour = 12; 
        minute = 0; 
        s = s.replace(/\bnoon\b/,''); 
        timeExplanation = 'noon'; 
    }
    if(/\bmidnight\b/.test(s)) { 
        hour = 0; 
        minute = 0; 
        s = s.replace(/\bmidnight\b/,''); 
        timeExplanation = 'midnight'; 
    }
    
    // Patterns: 5:30pm, 05:30, 17:30, 530pm
    // 1) hh:mm(:ss)? (am|pm)?
    const t1: RegExpMatchArray | null = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/);
    if(t1) {
        hour = parseInt(t1[1],10);
        minute = parseInt(t1[2],10);
        if(t1[3]) second = parseInt(t1[3],10);
        if(t1[4]) {
            const ap: string = t1[4];
            if(ap === 'pm' && hour < 12) hour += 12;
            if(ap === 'am' && hour === 12) hour = 0;
        }
        s = s.replace(t1[0], '').replace(/\s+/g,' ').trim();
        timeExplanation = `explicit ${t1[0]}`;
    } else {
        // 2) compact like 530pm or 1730pm (3 or 4 digits followed by am/pm)
        const t2: RegExpMatchArray | null = s.match(/\b(\d{3,4})(am|pm)\b/);
        if (t2) {
            const digits: string = t2[1];
            const ap: string = t2[2];
            if(digits.length === 3) {
                hour = parseInt(digits.slice(0,1),10);
                minute = parseInt(digits.slice(1),10);
            } else {
                hour = parseInt(digits.slice(0,2),10);
                minute = parseInt(digits.slice(2),10);
            }
            if(ap === 'pm' && hour < 12) hour += 12;
            if(ap === 'am' && hour === 12) hour = 0;
            s = s.replace(t2[0], '').replace(/\s+/g,' ').trim();
            timeExplanation = `compact ${t2[0]}`;
        }
    }
    
    if(hour !== null && (hour < 0 || hour > 23)) {
        return { explanation: 'Invalid hour value' };
    }
    
    if(minute < 0 || minute > 59) minute = 0;
    if(second < 0 || second > 59) second = 0;
    
    if(hour === null) {
        return { explanation: 'No valid time found' };
    }
    
    return {
        result: Temporal.PlainTime.from({ hour, minute, second }),
        explanation: timeExplanation || `Parsed time: ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}`
    };
}

export function parseFuzzyDateTime(input: string): {
    result?: Temporal.ZonedDateTime,
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { explanation: 'empty or non-string input' };

    // Use fuzzy date and time parsers
    const dateResult = parseFuzzyDate(input);
    if(!dateResult.result) {
        return { explanation: dateResult.explanation };
    }
    
    const timeResult = parseFuzzyTime(input);
    const timeZone = Temporal.Now.timeZoneId();

    // If time parsing failed, default to midnight
    const time = timeResult.result ?? Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 });

    try {
        const zdt = Temporal.ZonedDateTime.from({
            year: dateResult.result.year,
            month: dateResult.result.month,
            day: dateResult.result.day,
            hour: time.hour,
            minute: time.minute,
            second: time.second,
            timeZone
        });
        return {
            result: zdt,
            explanation: `Parsed fuzzy date (${dateResult.explanation}) and time (${timeResult.explanation || 'default midnight'})`
        };
    } catch {
        return { explanation: 'Could not produce a valid ZonedDateTime' };
    }
}

export function parseFuzzyDayOfYear(input: string): {
    result?: Temporal.PlainMonthDay;
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { explanation: 'empty or non-string input' };

    const months: Record<string, number> = {
        jan: 1, january: 1,
        feb: 2, february: 2,
        mar: 3, march: 3,
        apr: 4, april: 4,
        may: 5,
        jun: 6, june: 6,
        jul: 7, july: 7,
        aug: 8, august: 8,
        sep: 9, sept: 9, september: 9,
        oct: 10, october: 10,
        nov: 11, november: 11,
        dec: 12, december: 12
    };

    // Normalize
    let s: string = input.trim();
    let original: string = s;
    s = s.toLowerCase();

    // Reference date for current month/day
    const now = Temporal.Now.plainDateISO();

    // Simple cleanup - remove time-related patterns and other noise
    s = s.replace(/,/g, ' ')
        .replace(/\b(st|nd|rd|th)\b/g, '')
        .replace(/[@\_\(\)]/g, ' ')
        .replace(/[\/\\]+/g, ' ')
        .replace(/[-]+/g, ' ')
        .replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/gi, '')
        .replace(/\b(\d{3,4})(am|pm)\b/gi, '')
        .replace(/\b(noon|midnight)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Keywords - for day of year, we interpret these as current month/day
    const kwToday: boolean = /\btoday\b/.test(s);
    if(kwToday) return {
        result: Temporal.PlainMonthDay.from({ month: now.month, day: now.day }),
        explanation: 'Today (current month and day)'
    };

    // Months
    let foundMonth: number | null = null;
    for(const m of Object.keys(months)) {
        const rx = new RegExp('\\b' + m + '\\b');
        if(rx.test(s)) {
            foundMonth = months[m];
            s = s.replace(rx, '').replace(/\s+/g, ' ').trim();
            break;
        }
    }

    // Collect numeric tokens (days and potentially months)
    const numbers: number[] = (s.match(/\d{1,2}/g) || []).map(n => parseInt(n, 10));

    // If the original had numeric-date separators like 8/27 or 12-25
    const sepMatch: RegExpMatchArray | null = original.match(/^\s*(\d{1,2})[\/\-](\d{1,2})\s*$/);
    if(sepMatch && numbers.length >= 2) {
        const a: number = parseInt(sepMatch[1], 10);
        const b: number = parseInt(sepMatch[2], 10);
        let mon: number | null = null, day: number | null = null;

        if(a > 12) {
            day = a;
            mon = b;
        } else if(b > 12) {
            mon = a;
            day = b;
        } else {
            // Ambiguous case - use locale preference
            const preferDMY: boolean = guessDMYPreferred();
            if(preferDMY) {
                day = a;
                mon = b;
            } else {
                mon = a;
                day = b;
            }
        }

        // Validate month and day
        if(mon !== null && mon >= 1 && mon <= 12 && day !== null && day >= 1 && day <= 31) {
            const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if(day <= daysInMonth[mon - 1]) {
                try {
                    return {
                        result: Temporal.PlainMonthDay.from({ month: mon, day }),
                        explanation: `Parsed numeric-separated day of year (${original})`
                    };
                } catch {
                    return { explanation: 'Could not produce a valid PlainMonthDay' };
                }
            }
        }
    }

    let day: number | null = null, monthIndex: number | null = foundMonth;

    // Interpret numbers
    if(foundMonth !== null) {
        if(numbers.length === 0) {
            day = 1;
        } else if(numbers.length >= 1) {
            day = numbers[0];
        }
    } else {
        if(numbers.length === 1) {
            // Single number - assume it's a day in current month
            day = numbers[0];
            monthIndex = now.month;
        } else if(numbers.length >= 2) {
            const [a, b] = numbers;
            // Two numbers without explicit month - treat as month/day or day/month
            if(a > 12) {
                day = a;
                monthIndex = b;
            } else if(b > 12) {
                monthIndex = a;
                day = b;
            } else {
                const preferDMY: boolean = guessDMYPreferred();
                if(preferDMY) {
                    day = a;
                    monthIndex = b;
                } else {
                    monthIndex = a;
                    day = b;
                }
            }
        } else {
            return {
                result: Temporal.PlainMonthDay.from({ month: now.month, day: now.day }),
                explanation: 'Fallback to today (current month and day)'
            };
        }
    }

    if(monthIndex === null) monthIndex = now.month;
    if(day === null) day = 1;

    if(monthIndex < 1 || monthIndex > 12) {
        return { explanation: 'Invalid month value' };
    }

    if(day < 1 || day > 31) {
        return { explanation: 'Invalid day value' };
    }

    // We always allow leap days (Feb 29)
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if(day > daysInMonth[monthIndex - 1]) {
        return { explanation: `Day ${day} is invalid for month ${monthIndex}` };
    }

    try {
        return {
            result: Temporal.PlainMonthDay.from({ month: monthIndex, day }),
            explanation: `Parsed using heuristics (month=${monthIndex}, day=${day})`
        };
    } catch {
        return { explanation: 'Could not produce a valid PlainMonthDay' };
    }
}

function guessDMYPreferred(): boolean {
    let locale: string | null = null;
    try {
        const nav = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : null;
        locale = nav || (Intl && Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().locale) || 'en-US';
    } catch (e) {
        // lol why not
        locale = 'en-US';
    }
    
    // Preferred approach: use formatToParts to inspect the ordering
    try {
        if(Intl && Intl.DateTimeFormat) {
            // Pick a date with distinct day & month values
            const parts = new Intl.DateTimeFormat(locale, {
                day: 'numeric', month: 'numeric', year: 'numeric'
            }).formatToParts(new Date(1999, 10, 22));
            const dayIndex = parts.findIndex(p => p.type === 'day');
            const monthIndex = parts.findIndex(p => p.type === 'month');
            
            if(dayIndex >= 0 && monthIndex >= 0) {
                return dayIndex < monthIndex; // true => DMY, false => MDY
            }
        }
    } catch (e) {
        // Ignore and fall through
    }
    
    // Fallback heuristic: treat US as MDY, everything else as DMY (very rough)
    const lang = (locale || 'en-US').toLowerCase();
    if(lang.startsWith('en-us') || lang === 'us' || lang === 'en_us') return false;
    return true;
}
