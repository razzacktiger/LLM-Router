"use client";

import { useState } from "react";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { Todo } from "../actions/fetchData";
import { toggleTodo, createTodo } from "../actions/fetchData";

type TodoListProps = {
  initialTodos: Todo[];
};

export function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [isPending, startTransition] = useTransition();
  const [updatingTodoId, setUpdatingTodoId] = useState<number | null>(null);

  async function handleToggle(id: number) {
    try {
      setUpdatingTodoId(id);
      startTransition(async () => {
        const updatedTodos = await toggleTodo(id);
        setTodos(updatedTodos);
      });
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    } finally {
      setUpdatingTodoId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;

    // Optimistic update
    const optimisticTodo = {
      id: Date.now(),
      title: newTodo,
      completed: false,
    };

    setTodos(prev => [...prev, optimisticTodo]);
    setNewTodo("");

    try {
      startTransition(async () => {
        const updatedTodos = await createTodo(newTodo);
        setTodos(updatedTodos);
      });
    } catch (error) {
      // Revert optimistic update on error
      setTodos(prev => prev.filter(todo => todo.id !== optimisticTodo.id));
      console.error("Failed to create todo:", error);
    }
  }

  return (
    <div className="w-full">
      {/* Add Todo Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 rounded-lg bg-white/[0.05] px-4 py-2 text-sm text-white placeholder-zinc-400 ring-1 ring-white/[0.1] focus:outline-none focus:ring-2 focus:ring-white/[0.3]"
          />
          <button
            type="submit"
            disabled={!newTodo.trim() || isPending}
            className="rounded-lg bg-white/[0.1] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.15] focus:outline-none focus:ring-2 focus:ring-white/[0.3] disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      {/* Todo List */}
      <ul className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id}
            className="flex items-center gap-3 rounded-lg bg-white/[0.05] p-4 ring-1 ring-white/[0.1]"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo.id)}
                disabled={updatingTodoId === todo.id}
                className="h-5 w-5 rounded border-zinc-600 bg-zinc-900 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              />
              {updatingTodoId === todo.id && (
                <Loader2 className="absolute left-0 top-0 h-5 w-5 animate-spin text-blue-500" />
              )}
            </div>

            <span
              className={`flex-1 text-sm ${
                todo.completed ? "text-zinc-500 line-through" : "text-white"
              }`}
            >
              {todo.title}
            </span>
          </li>
        ))}
      </ul>

      {/* Empty State */}
      {todos.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
          <p className="text-sm text-zinc-500">No todos yet. Add one above!</p>
        </div>
      )}
    </div>
  );
}
