import mongoose from "mongoose";

// ── Sub-schema: one MCQ question ──────────────────────────────────────────────
const QuestionSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    text: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correctAnswer: { type: String, enum: ["A", "B", "C", "D"], required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const DilrSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    // DI or LR
    category: { type: String, enum: ["DI", "LR"], required: true },

    // More granular type — used for analytics and filtering
    type: {
      type: String,
      enum: [
        "table",           // DI: data table
        "bar-chart",       // DI: bar graph
        "pie-chart",       // DI: pie chart
        "line-chart",      // DI: line graph
        "seating",         // LR: seating arrangement
        "blood-relations", // LR: family tree / blood relations
        "grid",            // LR: Einstein-style grid puzzle
        "scheduling",      // LR: scheduling / ordering
        "games-tournament",// LR: sports tournament bracket
        "miscellaneous",   // anything else
      ],
      required: true,
    },

    // Where the set came from
    source: {
      type: String,
      enum: ["pyq", "ai-generated", "community"],
      default: "pyq",
    },
    year: Number,  // for PYQs
    slot: Number,  // for PYQs (1 or 2)

    // 1 (easiest) to 5 (hardest)
    difficulty: { type: Number, min: 1, max: 5, default: 3 },

    // Countdown timer in seconds. Default 10 min (CAT gives ~12 min per set).
    timeLimit: { type: Number, default: 600 },

    // ── Content ────────────────────────────────────────────────────────────────
    // Main passage / scenario description
    passage: { type: String, required: true },

    // For DI table sets: 2-D array where row[0] is the header row.
    // e.g. [["Company","Q1","Q2"],["Alpha","120","135"],...]
    dataTable: { type: [[String]], default: undefined },

    // Questions (typically 4, sometimes 3 or 5 in CAT)
    questions: { type: [QuestionSchema], required: true },
    // Optional images stored in Supabase
    images: {
      type: [
        {
          url: { type: String, required: true }, // Supabase public URL
          alt: { type: String, default: "" },
        },
      ],
      default: [],
    },
    // ── Community stats ────────────────────────────────────────────────────────
    timesAttempted: { type: Number, default: 0 },
    averageTimeSecs: { type: Number, default: 0 },
    averageRawScore: { type: Number, default: 0 },
    communityRating: { type: Number, default: 0 }, // 1–5
    ratingCount: { type: Number, default: 0 },

    // ── Daily set ──────────────────────────────────────────────────────────────
    isSetOfTheDay: { type: Boolean, default: false },
    setOfTheDayDate: { type: Date, default: null },

    // ── Admin ─────────────────────────────────────────────────────────────────
    status: { type: String, enum: ["active", "pending", "archived"], default: "active" },
    tags: { type: [String], default: [] },

    // Google Drive file ID — for sets stored externally (Phase 3)
    driveFileId: { type: String, default: null },

    // For community-submitted sets
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
DilrSetSchema.index({ category: 1, difficulty: 1, status: 1 });
DilrSetSchema.index({ isSetOfTheDay: 1, setOfTheDayDate: -1 });
DilrSetSchema.index({ source: 1 });

export default mongoose.models.DilrSet || mongoose.model("DilrSet", DilrSetSchema);
