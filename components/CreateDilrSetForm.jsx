"use client";

import { useMemo, useState } from "react";

const emptyQuestion = () => ({
  questionNumber: 1,
  text: "",
  options: { A: "", B: "", C: "", D: "" },
  correctAnswer: "A",
  explanation: "",
});

const emptyImage = () => ({
  url: "",
  path: "",
  alt: "",
});

export default function CreateDilrSetForm() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "DI",
    type: "table",
    source: "pyq",
    year: "",
    slot: "",
    difficulty: 3,
    timeLimit: 600,
    status: "active",
    tags: "",
    passage: "",
    dataTable: "",
    questions: [emptyQuestion()],
    images: [],
  });

  const typeOptions = useMemo(
    () => ({
      DI: ["table", "bar-chart", "pie-chart", "line-chart"],
      LR: ["seating", "blood-relations", "grid", "scheduling", "games-tournament", "miscellaneous"],
    }),
    []
  );

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateQuestion(index, key, value) {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [key]: value };
      return { ...prev, questions };
    });
  }

  function updateQuestionOption(index, optionKey, value) {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[index] = {
        ...questions[index],
        options: {
          ...questions[index].options,
          [optionKey]: value,
        },
      };
      return { ...prev, questions };
    });
  }

  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          ...emptyQuestion(),
          questionNumber: prev.questions.length + 1,
        },
      ],
    }));
  }

  function removeQuestion(index) {
    setForm((prev) => {
      const questions = prev.questions.filter((_, i) => i !== index);
      return {
        ...prev,
        questions: questions.length
          ? questions.map((q, i) => ({ ...q, questionNumber: i + 1 }))
          : [emptyQuestion()],
      };
    });
  }

  function addImage() {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, emptyImage()],
    }));
  }

  function updateImage(index, key, value) {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = { ...images[index], [key]: value };
      return { ...prev, images };
    });
  }

  function removeImage(index) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        type: form.type,
        source: form.source,
        year: form.year ? Number(form.year) : undefined,
        slot: form.slot ? Number(form.slot) : undefined,
        difficulty: Number(form.difficulty),
        timeLimit: Number(form.timeLimit),
        status: form.status,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        passage: form.passage.trim(),
        dataTable: form.dataTable ? JSON.parse(form.dataTable) : undefined,
        questions: form.questions.map((q) => ({
          questionNumber: Number(q.questionNumber),
          text: q.text.trim(),
          options: {
            A: q.options.A.trim(),
            B: q.options.B.trim(),
            C: q.options.C.trim(),
            D: q.options.D.trim(),
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation.trim(),
        })),
        images: form.images
          .map((img) => ({
            url: img.url.trim(),
            path: img.path.trim(),
            alt: img.alt.trim(),
          }))
          .filter((img) => img.url || img.path || img.alt),
      };

      const res = await fetch("/api/admin/dilr-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create set");
      }

      alert("DILR set created successfully");

      setForm({
        title: "",
        category: "DI",
        type: "table",
        source: "pyq",
        year: "",
        slot: "",
        difficulty: 3,
        timeLimit: 600,
        status: "active",
        tags: "",
        passage: "",
        dataTable: "",
        questions: [emptyQuestion()],
        images: [],
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create set");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Create DILR Set</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill the full set data here. Text is forced dark so it stays readable.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="CAT 2023 Slot 2 - Set 1"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </Field>

        <Field label="Status">
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="active">active</option>
            <option value="pending">pending</option>
            <option value="archived">archived</option>
          </select>
        </Field>

        <Field label="Category">
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.category}
            onChange={(e) => {
              const nextCategory = e.target.value;
              updateField("category", nextCategory);
              updateField("type", typeOptions[nextCategory][0]);
            }}
          >
            <option value="DI">DI</option>
            <option value="LR">LR</option>
          </select>
        </Field>

        <Field label="Type">
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
          >
            {typeOptions[form.category].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Source">
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.source}
            onChange={(e) => updateField("source", e.target.value)}
          >
            <option value="pyq">pyq</option>
            <option value="ai-generated">ai-generated</option>
            <option value="community">community</option>
          </select>
        </Field>

        <Field label="Difficulty">
          <input
            type="number"
            min="1"
            max="5"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.difficulty}
            onChange={(e) => updateField("difficulty", e.target.value)}
          />
        </Field>

        <Field label="Year">
          <input
            type="number"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="2023"
            value={form.year}
            onChange={(e) => updateField("year", e.target.value)}
          />
        </Field>

        <Field label="Slot">
          <input
            type="number"
            min="1"
            max="2"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="1"
            value={form.slot}
            onChange={(e) => updateField("slot", e.target.value)}
          />
        </Field>

        <Field label="Time Limit (seconds)">
          <input
            type="number"
            min="60"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={form.timeLimit}
            onChange={(e) => updateField("timeLimit", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Tags (comma separated)">
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="CAT, seating, tournament"
          value={form.tags}
          onChange={(e) => updateField("tags", e.target.value)}
        />
      </Field>

      <Field label="Passage / Scenario">
        <textarea
          className="min-h-[180px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Paste the full passage here..."
          value={form.passage}
          onChange={(e) => updateField("passage", e.target.value)}
        />
      </Field>

      <Field label="Data Table (JSON, optional)">
        <textarea
          className="min-h-[140px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 caret-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder='[["Company","Q1","Q2"],["A",10,20],["B",15,25]]'
          value={form.dataTable}
          onChange={(e) => updateField("dataTable", e.target.value)}
        />
      </Field>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Questions</h3>
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            + Add Question
          </button>
        </div>

        <div className="space-y-6">
          {form.questions.map((q, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-900">
                  Question {index + 1}
                </h4>

                {form.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Question Number">
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    value={q.questionNumber}
                    onChange={(e) =>
                      updateQuestion(index, "questionNumber", e.target.value)
                    }
                  />
                </Field>

                <Field label="Correct Answer">
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    value={q.correctAnswer}
                    onChange={(e) =>
                      updateQuestion(index, "correctAnswer", e.target.value)
                    }
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </Field>
              </div>

              <div className="mt-4 space-y-4">
                <Field label="Question Text">
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    value={q.text}
                    onChange={(e) => updateQuestion(index, "text", e.target.value)}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  {["A", "B", "C", "D"].map((opt) => (
                    <Field key={opt} label={`Option ${opt}`}>
                      <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                        value={q.options[opt]}
                        onChange={(e) =>
                          updateQuestionOption(index, opt, e.target.value)
                        }
                      />
                    </Field>
                  ))}
                </div>

                <Field label="Explanation">
                  <textarea
                    className="min-h-[90px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    value={q.explanation}
                    onChange={(e) =>
                      updateQuestion(index, "explanation", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Images from Supabase</h3>
          <button
            type="button"
            onClick={addImage}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            + Add Image
          </button>
        </div>

        {form.images.length === 0 ? (
          <p className="text-sm text-slate-500">
            Leave this empty for text-only sets.
          </p>
        ) : (
          <div className="space-y-4">
            {form.images.map((img, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Image {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="URL">
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                      value={img.url}
                      onChange={(e) => updateImage(index, "url", e.target.value)}
                    />
                  </Field>

                  <Field label="Path">
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                      value={img.path}
                      onChange={(e) => updateImage(index, "path", e.target.value)}
                    />
                  </Field>

                  <Field label="Alt Text">
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                      value={img.alt}
                      onChange={(e) => updateImage(index, "alt", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        disabled={loading}
        className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create DILR Set"}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}