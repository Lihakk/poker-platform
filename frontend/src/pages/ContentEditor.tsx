import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import api from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, Pencil, Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

type Kind = "modules" | "quizzes" | "questions";
type Module = {
  id: number;
  title: string;
  description: string;
  display_order: number;
  owner_id: number;
};
type Quiz = { id: number; title: string; module_id: number };
type Option = { text: string; is_correct: boolean };
type Question = {
  id: number;
  quiz_id: number;
  text: string;
  explanation?: string;
  options: Option[];
};
type Item = Module | Quiz | Question;
const singular: Record<Kind, string> = {
  modules: "module",
  quizzes: "quiz",
  questions: "question",
};
type Page<T> = {
  data: T[];
  pagination: { page: number; limit: number; total: number };
};

const emptyOptions = (): Option[] => [
  { text: "", is_correct: true },
  { text: "", is_correct: false },
  { text: "", is_correct: false },
  { text: "", is_correct: false },
];

export default function ContentEditor() {
  const user = useAuthStore((state) => state.user);
  const [kind, setKind] = useState<Kind>("modules");
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [modal, setModal] = useState<"edit" | "delete" | "view" | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown>>({});
  const [overview, setOverview] = useState({
    modules: 0,
    quizzes: 0,
    questions: 0,
  });
  const [roleUser, setRoleUser] = useState("");
  const [role, setRole] = useState("learner");
  const [editing, setEditing] = useState<Item | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [explanation, setExplanation] = useState("");
  const [order, setOrder] = useState(0);
  const [moduleID, setModuleID] = useState("");
  const [quizID, setQuizID] = useState("");
  const [options, setOptions] = useState<Option[]>(emptyOptions);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const view = async (item: Item) => {
    setStatus("");
    try {
      const result = await api.get(`/v1/${kind}/${item.id}`);
      setDetail(result.data.data);
      setModal("view");
    } catch {
      setStatus("Could not open this resource.");
    }
  };

  const reloadParents = useCallback(async () => {
    const [moduleResult, quizResult, overviewResult] = await Promise.all([
      api.get<Page<Module>>("/v1/modules?limit=100"),
      api.get<Page<Quiz>>("/v1/quizzes?limit=100"),
      api.get("/v1/overview"),
    ]);
    setModules(moduleResult.data.data);
    setQuizzes(quizResult.data.data);
    setOverview(overviewResult.data);
  }, []);

  const listUrl = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (kind === "modules" && filter.trim()) params.set("title", filter.trim());
    if (kind === "quizzes" && filter.trim()) params.set("title", filter.trim());
    if (kind === "questions" && filter.trim())
      params.set("text", filter.trim());
    if (selectedModule && kind === "quizzes")
      params.set("module_id", selectedModule);
    if (selectedModule && kind === "questions")
      params.set("module_id", selectedModule);
    return `/v1/${kind}?${params}`;
  }, [kind, page, filter, selectedModule]);

  const reload = useCallback(async () => {
    const result = await api.get<Page<Item>>(listUrl);
    setItems(result.data.data);
    setTotal(result.data.pagination.total);
  }, [listUrl]);

  useEffect(() => {
    let current = true;
    Promise.all([
      api.get<Page<Module>>("/v1/modules?limit=100"),
      api.get<Page<Quiz>>("/v1/quizzes?limit=100"),
      api.get("/v1/overview"),
    ])
      .then(([moduleResult, quizResult, overviewResult]) => {
        if (!current) return;
        setModules(moduleResult.data.data);
        setQuizzes(quizResult.data.data);
        setOverview(overviewResult.data);
      })
      .catch(() => {
        if (current) setStatus("Could not load learning content.");
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    let current = true;
    api
      .get<Page<Item>>(listUrl)
      .then((result) => {
        if (!current) return;
        setItems(result.data.data);
        setTotal(result.data.pagination.total);
      })
      .catch(() => {
        if (current) setStatus("Could not load this list.");
      });
    return () => {
      current = false;
    };
  }, [listUrl]);

  if (user?.role !== "admin" && user?.role !== "editor") {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="w-full p-4 pt-24 md:ml-64 md:p-10">
          <h1 className="text-2xl font-bold">Content editor</h1>
          <p className="mt-4 text-slate-400">Editor access is required.</p>
        </main>
      </div>
    );
  }

  const openForm = (item: Item | null) => {
    const firstOwnedModule = modules.find(
      (module) => user?.role === "admin" || module.owner_id === user?.id,
    );
    const firstOwnedQuiz = quizzes.find(
      (quiz) =>
        user?.role === "admin" ||
        modules.some(
          (module) =>
            module.id === quiz.module_id && module.owner_id === user?.id,
        ),
    );
    setEditing(item);
    setTitle(
      item && "title" in item
        ? item.title
        : item && "text" in item
          ? item.text
          : "",
    );
    setDescription(item && "description" in item ? item.description : "");
    setExplanation(item && "text" in item ? (item.explanation ?? "") : "");
    setOrder(item && "display_order" in item ? item.display_order : 0);
    setModuleID(
      item && "module_id" in item
        ? String(item.module_id)
        : firstOwnedModule
          ? String(firstOwnedModule.id)
          : "",
    );
    setQuizID(
      item && "quiz_id" in item
        ? String(item.quiz_id)
        : firstOwnedQuiz
          ? String(firstOwnedQuiz.id)
          : "",
    );
    setOptions(
      item && "options" in item
        ? item.options.map(({ text, is_correct }) => ({ text, is_correct }))
        : emptyOptions(),
    );
    setStatus("");
    setModal("edit");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const payload =
        kind === "modules"
          ? { title, description, display_order: order }
          : kind === "quizzes"
            ? { title, module_id: Number(moduleID) }
            : { text: title, explanation, quiz_id: Number(quizID), options };
      if (editing) await api.put(`/v1/${kind}/${editing.id}`, payload);
      else await api.post(`/v1/${kind}`, payload);
      setModal(null);
      setStatus(`${singular[kind]} saved.`);
      await reloadParents();
      await reload();
    } catch (error) {
      setStatus(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "Save failed."
          : "Save failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await api.delete(`/v1/${kind}/${editing.id}`);
      setModal(null);
      setStatus("Item deleted.");
      if (items.length === 1 && page > 1) setPage(page - 1);
      else await reload();
      await reloadParents();
    } catch (error) {
      setStatus(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "Delete failed."
          : "Delete failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const label = (item: Item) => ("text" in item ? item.text : item.title);
  const owned = (item: Item) => {
    if (user.role === "admin") return true;
    const id =
      "owner_id" in item
        ? item.id
        : "module_id" in item
          ? item.module_id
          : quizzes.find((quiz) => quiz.id === item.quiz_id)?.module_id;
    return modules.find((module) => module.id === id)?.owner_id === user.id;
  };
  const quizChoices = quizzes.filter(
    (quiz) =>
      user.role === "admin" ||
      modules.some(
        (module) => module.id === quiz.module_id && module.owner_id === user.id,
      ),
  );
  const moduleChoices = modules.filter(
    (module) => user.role === "admin" || module.owner_id === user.id,
  );
  const canCreate =
    kind === "modules" ||
    (kind === "quizzes" ? moduleChoices.length > 0 : quizChoices.length > 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="w-full min-w-0 p-4 pt-24 md:ml-64 md:p-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs font-bold uppercase text-cyan-300">
              Learning library
            </p>
            <h1 className="mt-2 text-3xl font-black">Content editor</h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage modules, quizzes and questions.
            </p>
          </div>
          <Button
            type="button"
            disabled={!canCreate}
            onClick={() => openForm(null)}
            className="rounded-md bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            <Plus size={16} /> Add {singular[kind]}
          </Button>
        </header>
        <div className="editor-insight">
          {Object.entries(overview)
            .filter(([key]) =>
              ["modules", "quizzes", "questions"].includes(key),
            )
            .map(([key, value]) => (
              <span key={key}>
                <strong>{String(value)}</strong>
                {key}
              </span>
            ))}
        </div>
        <Tabs
          value={kind}
          onValueChange={(value) => {
            setKind(value as Kind);
            setPage(1);
            setFilter("");
            setSelectedModule("");
          }}
        >
          <TabsList aria-label="Content type" className="mb-5 w-full max-w-md">
            {(["modules", "quizzes", "questions"] as Kind[]).map((value) => (
              <TabsTrigger
                value={value}
                key={value}
                type="button"
                aria-selected={kind === value}
                onClick={() => {
                  setKind(value);
                  setPage(1);
                  setFilter("");
                  setSelectedModule("");
                }}
                className={`min-w-0 flex-1 px-2 py-3 text-xs font-bold capitalize sm:text-sm ${kind === value ? "border-b-2 border-cyan-400 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {value}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            aria-label="Search content"
            placeholder="Search content"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white"
          />
          {kind !== "modules" && (
            <select
              aria-label="Filter by module"
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
            >
              <option value="">All modules</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          )}
        </div>
        {status && (
          <p
            role="status"
            className="mb-4 rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-sm"
          >
            {status}
          </p>
        )}
        <div className="overflow-x-auto border-y border-slate-800">
          {items.length === 0 ? (
            <p className="py-8 text-slate-400">No content matches this view.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 py-4 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold">{label(item)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    ID {item.id}
                    {"module_id" in item ? ` · Module ${item.module_id}` : ""}
                    {"quiz_id" in item ? ` · Quiz ${item.quiz_id}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  title="View resource"
                  aria-label={`View ${singular[kind]} ${item.id}`}
                  onClick={() => void view(item)}
                >
                  <Eye size={16} />
                </Button>
                {owned(item) && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openForm(item)}
                      className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
                    >
                      <span className="editor-action">
                        <Pencil size={14} />
                        Edit
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(item);
                        setStatus("");
                        setModal("delete");
                      }}
                      className="rounded-md border border-rose-800 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950"
                    >
                      <span className="editor-action">
                        <Trash2 size={14} />
                        Delete
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          <span>
            {total} total · Page {page}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded border border-slate-700 px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
              className="rounded border border-slate-700 px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
        {user.role === "admin" && (
          <section className="mt-10 border-t border-slate-700 pt-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck size={18} />
              Account access
            </h2>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                try {
                  await api.put(`/users/${roleUser}/role`, { role });
                  setStatus(`Account ${roleUser} is now ${role}.`);
                } catch (error) {
                  setStatus(
                    axios.isAxiosError(error)
                      ? error.response?.data?.error || "Role update failed."
                      : "Role update failed.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="text-sm">
                User ID
                <input
                  aria-label="User ID"
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={roleUser}
                  onChange={(event) => setRoleUser(event.target.value)}
                  className="mt-2 block w-32 rounded border border-slate-600 p-2"
                />
              </label>
              <label className="text-sm">
                Role
                <select
                  aria-label="Role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="mt-2 block rounded border border-slate-600 p-2"
                >
                  {["learner", "editor", "admin"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <Button disabled={busy} type="submit">
                Update role
              </Button>
            </form>
          </section>
        )}
      </main>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => !open && !busy && setModal(null)}
      >
        <DialogContent
          showCloseButton={!busy}
          className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-md border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        >
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle id="editor-title" className="text-xl font-bold">
              {modal === "delete"
                ? "Delete content"
                : modal === "view"
                  ? `${singular[kind]} details`
                  : `${editing ? "Edit" : "Add"} ${singular[kind]}`}
            </DialogTitle>
          </div>
          <DialogDescription>
            {modal === "view"
              ? "Current database record"
              : modal === "delete"
                ? "Permanent removal"
                : "Learning content"}
          </DialogDescription>
          {modal === "view" ? (
            <dl className="editor-detail">
              {Object.entries(detail)
                .filter(([, value]) => value !== null)
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{key.replaceAll("_", " ")}</dt>
                    <dd>
                      {Array.isArray(value)
                        ? value
                            .map(
                              (entry) =>
                                entry.title ||
                                entry.text ||
                                JSON.stringify(entry),
                            )
                            .join("\n") || "None"
                        : String(value)}
                    </dd>
                  </div>
                ))}
            </dl>
          ) : modal === "delete" ? (
            <>
              <p className="text-slate-300">
                Delete “{editing ? label(editing) : ""}” and its child content?
                This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setModal(null)}
                  className="rounded border border-slate-700 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={remove}
                  className="rounded bg-rose-600 px-4 py-2 font-bold disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
              {status && (
                <p role="alert" className="text-sm text-rose-300">
                  {status}
                </p>
              )}
            </>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <label className="block text-sm text-slate-300">
                {kind === "questions" ? "Question" : "Title"}
                <input
                  required
                  minLength={kind === "questions" ? 8 : 3}
                  maxLength={kind === "questions" ? undefined : 200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </label>
              {kind === "modules" && (
                <>
                  <label className="block text-sm text-slate-300">
                    Description
                    <textarea
                      required
                      minLength={10}
                      maxLength={6000}
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    Display order
                    <input
                      type="number"
                      min="0"
                      max={1000000}
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </label>
                </>
              )}
              {kind === "quizzes" && (
                <label className="block text-sm text-slate-300">
                  Module
                  <select
                    required
                    value={moduleID}
                    onChange={(e) => setModuleID(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {moduleChoices.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {kind === "questions" && (
                <>
                  <label className="block text-sm text-slate-300">
                    Quiz
                    <select
                      required
                      value={quizID}
                      onChange={(e) => setQuizID(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    >
                      {quizChoices.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset className="space-y-2">
                    <legend className="mb-2 text-sm text-slate-300">
                      Answers · select the correct one
                    </legend>
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct"
                          checked={option.is_correct}
                          onChange={() =>
                            setOptions(
                              options.map((entry, at) => ({
                                ...entry,
                                is_correct: at === index,
                              })),
                            )
                          }
                          aria-label={`Answer ${index + 1} is correct`}
                        />
                        <input
                          required
                          maxLength={200}
                          value={option.text}
                          onChange={(e) =>
                            setOptions(
                              options.map((entry, at) =>
                                at === index
                                  ? { ...entry, text: e.target.value }
                                  : entry,
                              ),
                            )
                          }
                          placeholder={`Answer ${index + 1}`}
                          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        />
                      </div>
                    ))}
                  </fieldset>
                </>
              )}
              {status && (
                <p role="alert" className="text-sm text-rose-300">
                  {status}
                </p>
              )}
              {kind === "questions" && (
                <label className="block text-sm text-slate-300">
                  Answer explanation
                  <textarea
                    rows={4}
                    maxLength={5000}
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded border border-slate-700 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  type="submit"
                  className="rounded bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
