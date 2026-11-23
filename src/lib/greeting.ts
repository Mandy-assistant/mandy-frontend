export const greeting = (date = new Date()) => {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/** The browser's IANA timezone, sent to date-filtered endpoints as `tz`. */
export const userTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
