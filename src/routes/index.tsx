import { createFileRoute } from "@tanstack/react-router";
import { Comparison } from "@/comparison/Comparison";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dermatologist in Karur | Sanjay Rithik Hospital" },
    { name: "description", content: "Consult a dermatologist at Sanjay Rithik Hospital, Karur, for acne, pigmentation, hair loss, sensitive skin, scars, ageing skin and other skin concerns." },
    { property: "og:title", content: "Dermatology Care in Karur | Sanjay Rithik Hospital" },
    { property: "og:description", content: "Personalised dermatology care for acne, pigmentation, hair and scalp concerns, sensitive skin, scars, ageing skin and more at Sanjay Rithik Hospital, Karur." },
  ] }),
  component: Comparison,
});
