"use server";

import { Logger } from "@/utils/logger";

const logger = new Logger("ServerAction:Todo");

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

// Simulated database data
const MOCK_TODOS: Todo[] = [
  { id: 1, title: "Learn Next.js", completed: false },
  { id: 2, title: "Build a project", completed: true },
  { id: 3, title: "Write documentation", completed: false },
];

export async function fetchTodos() {
  try {
    logger.info("fetchTodos - Started fetching todos");

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    logger.info("fetchTodos - Successfully fetched todos", {
      count: MOCK_TODOS.length,
    });

    return MOCK_TODOS;
  } catch (error) {
    logger.error("fetchTodos - Failed to fetch todos", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to handle at UI level
  }
}

export async function toggleTodo(id: number) {
  try {
    logger.info("toggleTodo - Started toggling todo", { id });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would update the database
    const todo = MOCK_TODOS.find(todo => todo.id === id);
    if (!todo) {
      logger.warn("toggleTodo - Todo not found", { id });
      throw new Error(`Todo with id ${id} not found`);
    }

    todo.completed = !todo.completed;

    logger.info("toggleTodo - Successfully toggled todo", {
      id,
      completed: todo.completed,
    });

    return MOCK_TODOS;
  } catch (error) {
    logger.error("toggleTodo - Failed to toggle todo", {
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to handle at UI level
  }
}

export async function createTodo(title: string) {
  try {
    logger.info("createTodo - Started creating todo", { title });

    if (!title.trim()) {
      logger.warn("createTodo - Empty title provided");
      throw new Error("Todo title cannot be empty");
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would create a new todo in the database
    const newTodo: Todo = {
      id: Date.now(),
      title,
      completed: false,
    };

    MOCK_TODOS.push(newTodo);

    logger.info("createTodo - Successfully created todo", {
      id: newTodo.id,
      title: newTodo.title,
    });

    return MOCK_TODOS;
  } catch (error) {
    logger.error("createTodo - Failed to create todo", {
      title,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to handle at UI level
  }
}
