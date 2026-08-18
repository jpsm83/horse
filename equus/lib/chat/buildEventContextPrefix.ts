/**
 * Build a plain-text context prefix for chat opened from a Planning event.
 */

type PlanningEventContext = {
  title: string;
  start: string;
  horseName: string;
};

export function buildEventContextPrefix(event: PlanningEventContext): string {
  const dateLabel = new Date(event.start).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Re: ${event.title} on ${event.horseName} (${dateLabel})`;
}
