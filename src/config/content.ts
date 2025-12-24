import {
  Calendar03Icon,
  ChartLineData01Icon,
  SecurityCheckIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

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
    icon: Calendar03Icon,
    title: "Simple Sessions",
    description:
      "Create sessions for your meetings, classes, or events. Take attendance in seconds with a clean, intuitive interface.",
  },
  {
    icon: UserGroupIcon,
    title: "Manage Members",
    description:
      "Keep track of your roster. Add members, view attendance history, and see who's consistently showing up.",
  },
  {
    icon: ChartLineData01Icon,
    title: "Attendance Reports",
    description:
      "Get insights into attendance patterns. Export data, track trends, and make informed decisions.",
  },
  {
    icon: SecurityCheckIcon,
    title: "Secure & Private",
    description:
      "Your data stays yours. Built with security in mind for school and organization use.",
  },
] as const;
