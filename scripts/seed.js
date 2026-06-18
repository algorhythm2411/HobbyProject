/**
 * scripts/seed.js
 * Populates MongoDB with sample DILR sets.
 * Run with: npm run seed
 *
 * Uses CommonJS (require) so it runs directly with Node
 * without going through Next.js's build pipeline.
 */

"use strict";

require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found. Make sure .env.local exists.");
  process.exit(1);
}

// ── Inline schema (mirrors models/DilrSet.js) ─────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    questionNumber: Number,
    text: String,
    options: { A: String, B: String, C: String, D: String },
    correctAnswer: { type: String, enum: ["A", "B", "C", "D"] },
    explanation: String,
  },
  { _id: false }
);

const dilrSetSchema = new mongoose.Schema(
  {
    title: String,
    category: { type: String, enum: ["DI", "LR"] },
    type: String,
    source: { type: String, enum: ["pyq", "ai-generated", "community"], default: "ai-generated" },
    difficulty: Number,
    timeLimit: { type: Number, default: 600 },
    passage: String,
    dataTable: [[String]],
    questions: [questionSchema],
    isSetOfTheDay: { type: Boolean, default: false },
    setOfTheDayDate: Date,
    status: { type: String, default: "active" },
    tags: [String],
    timesAttempted: { type: Number, default: 0 },
    communityRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const DilrSet =
  mongoose.models["DilrSet"] ?? mongoose.model("DilrSet", dilrSetSchema);

// ── Sample sets ───────────────────────────────────────────────────────────────
// These are original puzzles — no copyright issues.
// Replace or supplement with CAT PYQs from official IIM sources.

const SAMPLE_SETS = [
  // ── SET 1: DI — Data Table ──────────────────────────────────────────────────
  {
    title: "Quarterly sales of five companies",
    category: "DI",
    type: "table",
    source: "ai-generated",
    difficulty: 2,
    timeLimit: 600,
    passage:
      "The table below shows the number of units sold (in thousands) by five companies " +
      "— Alpha, Beta, Gamma, Delta, and Epsilon — across four quarters (Q1 to Q4) of a financial year.",
    dataTable: [
      ["Company", "Q1",  "Q2",  "Q3",  "Q4"],
      ["Alpha",   "120", "135", "98",  "150"],
      ["Beta",    "80",  "92",  "105", "88"],
      ["Gamma",   "55",  "60",  "72",  "65"],
      ["Delta",   "200", "185", "210", "195"],
      ["Epsilon", "40",  "48",  "38",  "52"],
    ],
    questions: [
      {
        questionNumber: 1,
        text: "Which company showed the highest percentage growth in sales from Q1 to Q4?",
        options: { A: "Alpha", B: "Beta", C: "Gamma", D: "Epsilon" },
        correctAnswer: "D",
        explanation:
          "Alpha: (150−120)/120 = 25%. Beta: (88−80)/80 = 10%. " +
          "Gamma: (65−55)/55 ≈ 18.2%. Epsilon: (52−40)/40 = 30%. " +
          "Epsilon has the highest growth at 30%.",
      },
      {
        questionNumber: 2,
        text: "What was the total number of units sold by Delta (in thousands) across all four quarters?",
        options: { A: "780", B: "790", C: "800", D: "810" },
        correctAnswer: "B",
        explanation: "200 + 185 + 210 + 195 = 790 thousand units.",
      },
      {
        questionNumber: 3,
        text: "In which quarter was the combined sales of Alpha and Beta the highest?",
        options: { A: "Q1", B: "Q2", C: "Q3", D: "Q4" },
        correctAnswer: "D",
        explanation:
          "Q1: 120+80=200. Q2: 135+92=227. Q3: 98+105=203. Q4: 150+88=238. " +
          "Q4 has the highest combined sales of 238 thousand.",
      },
      {
        questionNumber: 4,
        text: "What is the average quarterly sales of Gamma (in thousands)?",
        options: { A: "60.5", B: "61", C: "63", D: "65" },
        correctAnswer: "C",
        explanation:
          "(55 + 60 + 72 + 65) / 4 = 252 / 4 = 63 thousand units.",
      },
    ],
    isSetOfTheDay: true,
    setOfTheDayDate: new Date(),
    status: "active",
    tags: ["table", "percentage", "averages", "sales"],
  },

  // ── SET 2: LR — Seating Arrangement ────────────────────────────────────────
  {
    title: "Six friends in a row",
    category: "LR",
    type: "seating",
    source: "ai-generated",
    difficulty: 3,
    timeLimit: 720,
    passage:
      "Six friends — Aryan, Bina, Chirag, Divya, Eshan, and Fatima — are seated in a row " +
      "facing north. Seats are numbered 1 (leftmost) to 6 (rightmost).\n\n" +
      "Conditions:\n" +
      "(i)   Aryan sits at seat 4.\n" +
      "(ii)  Bina sits exactly two seats to the left of Chirag.\n" +
      "(iii) Eshan is not seated at an extreme end.\n" +
      "(iv)  Divya sits immediately to the right of Eshan.\n" +
      "(v)   Fatima is not seated adjacent to Aryan.\n\n" +
      "Note: The final arrangement is — Bina(1), Fatima(2), Chirag(3), Aryan(4), Eshan(5), Divya(6).",
    questions: [
      {
        questionNumber: 1,
        text: "Who is sitting immediately to the left of Chirag?",
        options: { A: "Aryan", B: "Fatima", C: "Bina", D: "Eshan" },
        correctAnswer: "B",
        explanation:
          "Arrangement: Bina(1) Fatima(2) Chirag(3) Aryan(4) Eshan(5) Divya(6). " +
          "Seat 2 (immediately left of Chirag at 3) is Fatima.",
      },
      {
        questionNumber: 2,
        text: "How many people are seated between Aryan and Bina?",
        options: { A: "1", B: "2", C: "3", D: "0" },
        correctAnswer: "B",
        explanation:
          "Aryan is at 4 and Bina is at 1. Between them sit Fatima (2) and Chirag (3) — 2 people.",
      },
      {
        questionNumber: 3,
        text: "Which pair of friends are seated at the extreme ends?",
        options: {
          A: "Bina and Chirag",
          B: "Aryan and Eshan",
          C: "Bina and Divya",
          D: "Fatima and Divya",
        },
        correctAnswer: "C",
        explanation:
          "Seat 1 (leftmost) = Bina. Seat 6 (rightmost) = Divya.",
      },
      {
        questionNumber: 4,
        text: "Who is seated third from the right?",
        options: { A: "Aryan", B: "Chirag", C: "Fatima", D: "Eshan" },
        correctAnswer: "A",
        explanation:
          "From the right: Divya (1st), Eshan (2nd), Aryan (3rd).",
      },
    ],
    status: "active",
    tags: ["seating", "arrangement", "row", "order"],
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected.\n");

  // Remove previously seeded sample sets so re-running is idempotent
  const deleted = await DilrSet.deleteMany({ source: "ai-generated" });
  if (deleted.deletedCount > 0) {
    console.log(`🗑️   Removed ${deleted.deletedCount} existing sample set(s).`);
  }

  const inserted = await DilrSet.insertMany(SAMPLE_SETS);
  console.log(`✅  Inserted ${inserted.length} DILR sets:`);
  inserted.forEach((s, i) =>
    console.log(`    ${i + 1}. [${s.category}] ${s.title}`)
  );

  console.log("\n🎉  Seeding complete! Run `npm run dev` to start the app.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
