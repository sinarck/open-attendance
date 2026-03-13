import { Calendar, LineChart, ShieldCheck, Users } from "lucide-react";

// Home page highlights
export const homeHighlights = [
  "No monthly fees",
  "No vendor lock-in",
  "Takes 30 seconds to set up",
] as const;

// About page values
export const aboutValues = [
  {
    title: "Simple by design",
    description:
      "Attendance tracking shouldn't require training. If it takes more than a minute to learn, we've failed.",
  },
  {
    title: "Open source",
    description:
      "Your data, your rules. Self-host it, audit the code, or contribute improvements. No vendor lock-in.",
  },
  {
    title: "Built for schools",
    description:
      "Designed with student organizations in mind. Privacy-first, secure, and appropriate for educational settings.",
  },
] as const;

// Features page content
export const featuresList = [
  {
    icon: Calendar,
    title: "Simple Sessions",
    description:
      "Create sessions for your meetings, classes, or events. Take attendance in seconds with a clean, intuitive interface.",
  },
  {
    icon: Users,
    title: "Manage Members",
    description:
      "Keep track of your roster. Add members, view attendance history, and see who's consistently showing up.",
  },
  {
    icon: LineChart,
    title: "Attendance Reports",
    description:
      "Get insights into attendance patterns. Export data, track trends, and make informed decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    description:
      "Your data stays yours. Built with security in mind for school and organization use.",
  },
] as const;
