
/**
 * Branded types for string-serialized date/time formats.
 */

/**
 * ISO 8601-ish format (specifically, [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)) with timezone and a prefix.  
 * This is used for event start/end times if a time zone is specified.  
 * Except the prefix, this is how a [Temporal.ZonedDateTime](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime#rfc_9557_format) serializes itself.  
 *   
 * `ZonedDateTime|YYYY-MM-DD T HH:mm:ss.sssssssss Z/±HH:mm [time_zone_id] [u-ca=calendar_id]` (spaces only for readability)  
 * 
 * e.g. `ZonedDateTime|2025-01-01T12:00:00[America/New_York][u-ca=iso8601]`  
 */
export type ZonedDateTimeString = string & { readonly __brand: unique symbol };
/**
 * ISO 8601-ish format day without a timezone (specifically, [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)) and a prefix.  
 * This is used for events that last all day.  
 * Except the prefix, this is how a [Temporal.PlainDate](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate#rfc_9557_format) serializes itself.  
 *   
 * `PlainDate|YYYY-MM-DD [u-ca=calendar_id]` (spaces only for readability)  
 * 
 * e.g. `PlainDate|2025-01-01[u-ca=iso8601]`  
 */
export type PlainDateString = string & { readonly __brand: unique symbol };
/**
 * ISO 8601-ish format day without a timezone or year (specifically, [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)) and a prefix.  
 * This is used for recurring events on specific days of the year.  
 * Except the prefix, this is how a [Temporal.PlainMonthDay](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainMonthDay#rfc_9557_format) serializes itself.  
 * 
 * `PlainMonthDay|YYYY-MM-DD [u-ca=calendar_id]` (spaces only for readability)  
 * The year is only required for non-iso calendars, which we don't really support, so it will almost never be present.  
 * 
 * e.g. `PlainMonthDay|01-01[u-ca=iso8601]`  
 */
export type PlainMonthDayString = string & { readonly __brand: unique symbol };
/**
 * [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)-formatted time and a prefix.  
 * This is used for times of recurring events.  
 * Except the prefix, this is how a [Temporal.PlainTime](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime#rfc_9557_format) serializes itself.  
 * 
 * `PlainTime|HH:mm:ss.sssssssss`  
 * e.g. `PlainTime|1:30:00`
 */
export type PlainTimeString = string & { readonly __brand: unique symbol };
/**
 * A [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)-like time and zone with a prefix.  
 * This is used for times of recurring events that have a specific time zone.
 * There is no Temporal object that directly corresponds to this format, as the zone is only used when resolving an instant.  
 * The stored offset, if present, will be relative to the timezone when the time was created, but it's not meaningful as a standalone value.
 * 
 * `ZonedTime|HH:mm:ss.sssssssss Z/±HH:mm [time_zone_id]` (spaces only for readability)
 * e.g. `ZonedTime|13:00:00-05:00[America/New_York]`
 */
export type ZonedTimeString = string & { readonly __brand: unique symbol };
