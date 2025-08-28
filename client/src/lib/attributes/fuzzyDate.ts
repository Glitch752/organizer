// I admit: this one was partially vibe-coded (blegh).
// I did NOT want to go through all that logic for a mediocre result anyway.

// TODO: Refactor this to a more generic system that can reuse code across these fuzzy matchers

import type { DateOnly, DateTime, DayOfYearOnly } from ".";

export function parseFuzzyDate(input: string): {
    date: Date | null;
    dateString: DateOnly | null;
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { date: null, dateString: null, explanation: 'empty or non-string input' };
    
    function dateString(d: Date): DateOnly {
        return d.getUTCFullYear() + '-' +
            String(d.getUTCMonth()+1).padStart(2,'0') + '-' +
            String(d.getUTCDate()).padStart(2,'0');
    }

    const months: Record<string, number> = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, sept: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11
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
    let now = new Date();
    if(isNaN(now.getTime())) now = new Date();
    
    // Quick Date parse. If valid, accept it (but set to midnight)
    const isoTry: Date = new Date(s);
    if(!isNaN(isoTry.getTime())) {
        const dateOnly = new Date(isoTry.getFullYear(), isoTry.getMonth(), isoTry.getDate());
        return {
            date: dateOnly,
            dateString: dateString(dateOnly),
            explanation: 'Parsed by standard Date constructor / ISO parsing'
        };
    }
    
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
        let base: Date = new Date(now.getTime());
        if(kwTomorrow) base.setDate(base.getDate() + 1);
        if(kwYesterday) base.setDate(base.getDate() - 1);
        // Set to midnight for date-only parsing
        const dateOnly = new Date(base.getFullYear(), base.getMonth(), base.getDate());
        return {
            date: dateOnly,
            dateString: dateString(dateOnly),
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
            s = s.replace(rx, '').replace(/\s+/g,' ').trim();
            break;
        }
    }
    
    // Months
    let foundMonth: number | null = null;
    for(const m of Object.keys(months)) {
        const rx = new RegExp('\\b' + m + '\\b');
        if(rx.test(s)) {
            foundMonth = months[m];
            s = s.replace(rx, '').replace(/\s+/g,' ').trim();
            break;
        }
    }
    
    // Collect numeric tokens (years/days)
    const numbers: number[] = (s.match(/\d{1,4}/g) || []).map(n => parseInt(n,10));
    
    // If the original had numeric-date separators like 8/27/25 or 2025-08-27
    const sepMatch: RegExpMatchArray | null = original.match(/^\s*(\d{1,4})[\/\-](\d{1,2})(?:[\/\-](\d{1,4}))?\s*$/);
    if(sepMatch && numbers.length >= 2) {
        const a: number = parseInt(sepMatch[1],10);
        const b: number = parseInt(sepMatch[2],10);
        const c: number | null = sepMatch[3] ? parseInt(sepMatch[3],10) : null;
        let year: number | null = null, mon: number | null = null, day: number | null = null;
        if(c !== null) {
            if(a > 31) { year = a; mon = b - 1; day = c; }
            else if(c > 31) { year = c; mon = a - 1; day = b; }
            else {
                const preferDMY: boolean = guessDMYPreferred();
                if(preferDMY) { day = a; mon = b - 1; year = c; }
                else { mon = a - 1; day = b; year = c; }
            }
        } else {
            if(a > 12) { day = a; mon = b - 1; year = now.getFullYear(); }
            else { mon = a - 1; day = b; year = now.getFullYear(); }
        }
        if(year !== null && year < 100) year += 2000;
        if(year === null) year = now.getFullYear();
        const finalDate: Date = new Date(year, mon!, day || 1);
        return {
            date: finalDate,
            dateString: dateString(finalDate),
            explanation: `Parsed numeric-separated date (${original})`
        };
    }
    
    // Now decide year/month/day using heuristics
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
    for(let i = numbers.length-1; i >= 0; i--) {
        const n = numbers[i];
        if(n >= 32) { year = n; numbers.splice(i,1); break; }
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
            if(possibleYearIndex !== null) {
                year = numbers.splice(possibleYearIndex,1)[0];
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
            const ref: Date = new Date(now.getTime());
            const target: number = targetWeekday;
            const daysAhead: number = (target - ref.getDay() + 7) % 7 || 7;
            const chosen: Date = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + daysAhead);
            return {
                date: chosen,
                dateString: dateString(chosen),
                explanation: `Next ${foundWeekdayText}`
            };
        } else {
            if(numbers.length === 1) {
                if(numbers[0] > 31) {
                    year = numbers[0];
                    monthIndex = 0; day = 1;
                } else {
                    day = numbers[0];
                    monthIndex = now.getMonth();
                    year = now.getFullYear();
                }
            } else if(numbers.length >= 2) {
                const [a,b,c] = numbers;
                if(a > 31) {
                    year = a; monthIndex = (b ? b-1 : now.getMonth()); day = c || 1;
                } else if(c && c > 31) {
                    year = c; monthIndex = a-1; day = b;
                } else {
                    monthIndex = a-1;
                    day = b;
                    if(c !== undefined) year = c;
                }
            } else {
                const fallback: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return {
                    date: fallback,
                    dateString: dateString(fallback),
                    explanation: 'Fallback to today'
                };
            }
        }
    }
    
    if(year === null) year = now.getFullYear();
    if(year < 100) year += 2000;
    
    if(monthIndex === null) monthIndex = now.getMonth();
    if(day === null) day = 1;
    
    const finalDate: Date = new Date(year, monthIndex, day);
    
    if(isNaN(finalDate.getTime())) {
        return { date: null, dateString: null, explanation: 'Could not produce a valid date' };
    }
    
    if(targetWeekday !== null && foundMonth !== null) {
        const chosenWD = finalDate.getDay();
        if(chosenWD !== targetWeekday) {
            let attempt = new Date(finalDate.getTime());
            for(let i = 1; i <= 14; i++) {
                attempt.setDate(attempt.getDate() + 1);
                if(attempt.getDay() === targetWeekday) {
                    if(attempt.getMonth() === finalDate.getMonth() || attempt.getFullYear() === finalDate.getFullYear()) {
                        finalDate.setTime(attempt.getTime());
                        break;
                    }
                }
            }
        }
    }
    
    return {
        date: finalDate,
        dateString: dateString(finalDate),
        explanation: `Parsed using heuristics (monthIndex=${monthIndex}, day=${day}, year=${year})`
    };
}

export function parseFuzzyTime(input: string): {
    isoTime: string | null;
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { isoTime: null, explanation: 'empty or non-string input' };
    
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
        return { isoTime: null, explanation: 'Invalid hour value' };
    }
    
    if(minute < 0 || minute > 59) minute = 0;
    if(second < 0 || second > 59) second = 0;
    
    if(hour === null) {
        return { isoTime: null, explanation: 'No valid time found' };
    }
    
    // ISO local time string (THH:MM:SS)
    const isoLocal = `T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}`;

    return {
        isoTime: isoLocal,
        explanation: timeExplanation || `Parsed time: ${isoLocal}`
    };
}

export function parseFuzzyDateTime(input: string): {
    date: Date | null;
    isoUTC: DateTime | null;
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { date: null, isoUTC: null, explanation: 'empty or non-string input' };
    
    const months: Record<string, number> = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, sept: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11
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
    let now = new Date();
    if(isNaN(now.getTime())) now = new Date();
    
    // Quick Date parse. If valid, accept it
    const isoTry: Date = new Date(s);
    if(!isNaN(isoTry.getTime())) return {
        date: isoTry,
        isoUTC: isoTry.toISOString(),
        explanation: 'Parsed by standard Date constructor / ISO parsing'
    };
    
    // Simple cleanup
    s = s.replace(/,/g, ' ')
    .replace(/\b(st|nd|rd|th)\b/g, '')
    .replace(/[@\_\(\)]/g, ' ')
    .replace(/[\/\\]+/g, ' ')
    .replace(/[-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
    // Extract timezone token (simple support for: Z / UTC / GMT / +hh:mm / +hhmm / -hhmm)
    // TODO: We could use a timezone database here
    let tzOffsetMinutes: number | null = null; // Minutes east of UTC (so +0200 -> +120)
    const tzMatch: RegExpMatchArray | null = s.match(/\b(z|utc|gmt|[+-]\d{2}:?\d{2})\b/);
    if(tzMatch) {
        const tzToken: string = tzMatch[0];
        s = s.replace(tzToken, ' ').replace(/\s+/g,' ').trim();
        if(tzToken === 'z' || tzToken === 'utc' || tzToken === 'gmt') {
            tzOffsetMinutes = 0;
        } else {
            // +HHMM or +HH:MM
            const sign: number = tzToken[0] === '-' ? -1 : 1;
            const nums: string = tzToken.slice(1).replace(':','');
            const hh: number = parseInt(nums.slice(0,2),10);
            const mm: number = parseInt(nums.slice(2).padEnd(2,'0'),10) || 0;
            tzOffsetMinutes = sign * (hh*60 + mm);
        }
    }
    
    // Keywords
    const kwToday: boolean = /\btoday\b/.test(s);
    const kwTomorrow: boolean = /\btomorrow\b/.test(s) || /\btmrw\b/.test(s);
    const kwYesterday: boolean = /\byesterday\b/.test(s);
    if(kwToday || kwTomorrow || kwYesterday) {
        let base: Date = new Date(now.getTime());
        if(kwTomorrow) base.setDate(base.getDate() + 1);
        if(kwYesterday) base.setDate(base.getDate() - 1);
        // Default time if not provided is midnight, but we might parse the time below and overwrite it
        now = base;
    }
    
    // Time parsing (extract time and remove from s)
    let hour: number | null = null, minute: number = 0, second: number = 0;
    let timeExplanation: string = '';
    // Named times
    if(/\bnoon\b/.test(s)) { hour = 12; minute = 0; s = s.replace(/\bnoon\b/,''); timeExplanation='noon'; }
    if(/\bmidnight\b/.test(s)) { hour = 0; minute = 0; s = s.replace(/\bmidnight\b/,''); timeExplanation='midnight'; }
    
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
    
    // If no time is found, default to midnight (00:00)
    if(hour === null) hour = 0;
    
    // Weekdays
    let targetWeekday: number | null = null;
    let foundWeekdayText: string | null = null;
    for(const w of Object.keys(weekdays)) {
        const rx = new RegExp('\\b' + w + '\\b');
        if(rx.test(s)) {
            targetWeekday = weekdays[w];
            foundWeekdayText = w;
            s = s.replace(rx, '').replace(/\s+/g,' ').trim();
            break;
        }
    }
    
    // Months
    let foundMonth: number | null = null;
    for(const m of Object.keys(months)) {
        const rx = new RegExp('\\b' + m + '\\b');
        if(rx.test(s)) {
            foundMonth = months[m];
            s = s.replace(rx, '').replace(/\s+/g,' ').trim();
            break;
        }
    }
    
    // Collect numeric tokens (years/days)
    const numbers: number[] = (s.match(/\d{1,4}/g) || []).map(n => parseInt(n,10));
    
    // If the original had numeric-date separators like 8/27/25 or 2025-08-27, we attempted ISO earlier but might not have matched.
    // Try explicit mm/dd/yyyy or dd/mm/yyyy style parse with separators from original input
    const sepMatch: RegExpMatchArray | null = original.match(/^\s*(\d{1,4})[\/\-](\d{1,2})(?:[\/\-](\d{1,4}))?\s*$/);
    if(sepMatch && numbers.length >= 2) {
        const a: number = parseInt(sepMatch[1],10);
        const b: number = parseInt(sepMatch[2],10);
        const c: number | null = sepMatch[3] ? parseInt(sepMatch[3],10) : null;
        let year: number | null = null, mon: number | null = null, day: number | null = null;
        if(c !== null) {
            if(a > 31) { year = a; mon = b - 1; day = c; }
            else if(c > 31) { year = c; mon = a - 1; day = b; }
            else {
                // We prefer day/month/year if the user is likely to be using that format
                // This could be a setting, but honestly meh
                const preferDMY: boolean = guessDMYPreferred();
                if(preferDMY) { day = a; mon = b - 1; year = c; }
                else { mon = a - 1; day = b; year = c; }
            }
        } else {
            if(a > 12) { day = a; mon = b - 1; year = now.getFullYear(); }
            else { mon = a - 1; day = b; year = now.getFullYear(); }
        }
        if(year !== null && year < 100) year += 2000;
        if(year === null) year = now.getFullYear();
        const localDate: Date = new Date(year, mon!, day || 1, hour, minute, second);
        const finalDate: Date = tzOffsetMinutes === null ? localDate : new Date(Date.UTC(year, mon!, day || 1, hour, minute, second) - tzOffsetMinutes*60*1000);
        return {
            date: finalDate,
            isoUTC: finalDate.toISOString(),
            explanation: `Parsed numeric-separated date (${original})`
        };
    }
    
    // Now decide year/month/day using heuristics
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
    for(let i = numbers.length-1; i >= 0; i--) {
        const n = numbers[i];
        if(n >= 32) { year = n; numbers.splice(i,1); break; }
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
            if(possibleYearIndex !== null) {
                year = numbers.splice(possibleYearIndex,1)[0];
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
            const ref: Date = new Date(now.getTime());
            const target: number = targetWeekday;
            const daysAhead: number = (target - ref.getDay() + 7) % 7 || 7;
            const chosen: Date = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + daysAhead, hour, minute, second);
            if(tzOffsetMinutes === null) {
                return {
                    date: chosen,
                    isoUTC: chosen.toISOString(),
                    explanation: `Next ${foundWeekdayText} at ${hour}:${String(minute).padStart(2,'0')}`
                };
            } else {
                const y = chosen.getFullYear(), m = chosen.getMonth(), d = chosen.getDate();
                const utcMs = Date.UTC(y,m,d,hour,minute,second) - tzOffsetMinutes*60*1000;
                const dt = new Date(utcMs);
                return {
                    date: dt,
                    isoUTC: dt.toISOString(),
                    explanation: `Next ${foundWeekdayText} at ${hour}:${String(minute).padStart(2,'0')} with explicit TZ`
                };
            }
        } else {
            if(numbers.length === 1) {
                if(numbers[0] > 31) {
                    year = numbers[0];
                    monthIndex = 0; day = 1;
                } else {
                    day = numbers[0];
                    monthIndex = now.getMonth();
                    year = now.getFullYear();
                }
            } else if(numbers.length >= 2) {
                const [a,b,c] = numbers;
                if(a > 31) {
                    year = a; monthIndex = (b ? b-1 : now.getMonth()); day = c || 1;
                } else if(c && c > 31) {
                    year = c; monthIndex = a-1; day = b;
                } else {
                    monthIndex = a-1;
                    day = b;
                    if(c !== undefined) year = c;
                }
            } else {
                const fallback: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second);
                const date = tzOffsetMinutes === null ? fallback : new Date(Date.UTC(
                    fallback.getFullYear(), fallback.getMonth(), fallback.getDate(),
                    hour, minute, second
                ) - tzOffsetMinutes * 60 * 1000);
                return {
                    date,
                    isoUTC: date.toISOString(),
                    explanation: 'Fallback to today at parsed time'
                };
            }
        }
    }
    
    if(year === null) year = now.getFullYear();
    if(year < 100) year += 2000;
    
    if(monthIndex === null) monthIndex = now.getMonth();
    if(day === null) day = 1;
    
    let finalDate: Date;
    if(tzOffsetMinutes === null) {
        finalDate = new Date(year, monthIndex, day, hour, minute, second);
    } else {
        const utcMs = Date.UTC(year, monthIndex, day, hour, minute, second) - tzOffsetMinutes*60*1000;
        finalDate = new Date(utcMs);
    }
    
    if(isNaN(finalDate.getTime())) {
        return { date: null, isoUTC: null, explanation: 'Could not produce a valid date' };
    }
    
    if(targetWeekday !== null && foundMonth !== null) {
        const chosenWD = finalDate.getDay();
        if(chosenWD !== targetWeekday) {
            let attempt = new Date(finalDate.getTime());
            for(let i = 1; i <= 14; i++) {
                attempt.setDate(attempt.getDate() + 1);
                if(attempt.getDay() === targetWeekday) {
                    if(attempt.getMonth() === finalDate.getMonth() || attempt.getFullYear() === finalDate.getFullYear()) {
                        finalDate = attempt;
                        break;
                    }
                }
            }
        }
    }
    
    return {
        date: finalDate,
        isoUTC: finalDate.toISOString(),
        explanation: `Parsed using heuristics (monthIndex=${monthIndex}, day=${day}, year=${year}, time=${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')})`
    };
}

export function parseFuzzyDayOfYear(input: string): {
    dayOfYear: DayOfYearOnly | null;
    explanation: string;
} {
    if(!input || typeof input !== 'string') return { dayOfYear: null, explanation: 'empty or non-string input' };
    
    function dayOfYearString(month: number, day: number): DayOfYearOnly {
        return String(month + 1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    }

    const months: Record<string, number> = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, sept: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11
    };
    
    // Normalize
    let s: string = input.trim();
    let original: string = s;
    s = s.toLowerCase();
    
    // Reference date for current month/day
    let now = new Date();
    if(isNaN(now.getTime())) now = new Date();
    
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
    
    // Keywords - for day of year, we interpret these as current year
    const kwToday: boolean = /\btoday\b/.test(s);
    if(kwToday) {
        return {
            dayOfYear: dayOfYearString(now.getMonth(), now.getDate()),
            explanation: 'Today (current month and day)'
        };
    }
    
    // Months
    let foundMonth: number | null = null;
    for(const m of Object.keys(months)) {
        const rx = new RegExp('\\b' + m + '\\b');
        if(rx.test(s)) {
            foundMonth = months[m];
            s = s.replace(rx, '').replace(/\s+/g,' ').trim();
            break;
        }
    }
    
    // Collect numeric tokens (days and potentially months)
    const numbers: number[] = (s.match(/\d{1,2}/g) || []).map(n => parseInt(n,10));
    
    // If the original had numeric-date separators like 8/27 or 12-25
    const sepMatch: RegExpMatchArray | null = original.match(/^\s*(\d{1,2})[\/\-](\d{1,2})\s*$/);
    if(sepMatch && numbers.length >= 2) {
        const a: number = parseInt(sepMatch[1],10);
        const b: number = parseInt(sepMatch[2],10);
        let mon: number | null = null, day: number | null = null;
        
        if(a > 12) { 
            day = a; 
            mon = b - 1; 
        } else if(b > 12) { 
            mon = a - 1; 
            day = b; 
        } else {
            // Ambiguous case - use locale preference
            const preferDMY: boolean = guessDMYPreferred();
            if(preferDMY) { 
                day = a; 
                mon = b - 1; 
            } else { 
                mon = a - 1; 
                day = b; 
            }
        }
        
        // Validate month and day
        if(mon !== null && mon >= 0 && mon <= 11 && day !== null && day >= 1 && day <= 31) {
            const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if(day <= daysInMonth[mon]) {
                return {
                    dayOfYear: dayOfYearString(mon, day),
                    explanation: `Parsed numeric-separated day of year (${original})`
                };
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
            monthIndex = now.getMonth();
        } else if(numbers.length >= 2) {
            const [a, b] = numbers;
            // Two numbers without explicit month - treat as month/day or day/month
            if(a > 12) {
                day = a;
                monthIndex = b - 1;
            } else if(b > 12) {
                monthIndex = a - 1;
                day = b;
            } else {
                const preferDMY: boolean = guessDMYPreferred();
                if(preferDMY) {
                    day = a;
                    monthIndex = b - 1;
                } else {
                    monthIndex = a - 1;
                    day = b;
                }
            }
        } else {
            return {
                dayOfYear: dayOfYearString(now.getMonth(), now.getDate()),
                explanation: 'Fallback to today (current month and day)'
            };
        }
    }
    
    if(monthIndex === null) monthIndex = now.getMonth();
    if(day === null) day = 1;
    
    if(monthIndex < 0 || monthIndex > 11) {
        return { dayOfYear: null, explanation: 'Invalid month value' };
    }
    
    if(day < 1 || day > 31) {
        return { dayOfYear: null, explanation: 'Invalid day value' };
    }
    
    // We always allow leap days (Feb 29)
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if(day > daysInMonth[monthIndex]) {
        return { dayOfYear: null, explanation: `Day ${day} is invalid for month ${monthIndex + 1}` };
    }
    
    return {
        dayOfYear: dayOfYearString(monthIndex, day),
        explanation: `Parsed using heuristics (month=${monthIndex + 1}, day=${day})`
    };
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
