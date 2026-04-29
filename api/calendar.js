export default async function handler(req, res) {
  try {
    const icsUrl = process.env.GOOGLE_CALENDAR_ICS_URL;

    if (!icsUrl) {
      return res.status(500).json({ error: "Brak GOOGLE_CALENDAR_ICS_URL" });
    }

    const response = await fetch(icsUrl);
    const text = await response.text();

    const events = text
      .split("BEGIN:VEVENT")
      .slice(1)
      .map(event => {
        const startMatch = event.match(/DTSTART(?:;VALUE=DATE)?:([0-9]{8})/);
        const endMatch = event.match(/DTEND(?:;VALUE=DATE)?:([0-9]{8})/);

        if (!startMatch || !endMatch) return null;

        const formatDate = (raw) =>
          `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;

        return {
          start: formatDate(startMatch[1]),
          end: formatDate(endMatch[1])
        };
      })
      .filter(Boolean);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ events });

  } catch (error) {
    return res.status(500).json({ error: "Nie udało się pobrać kalendarza" });
  }
}
